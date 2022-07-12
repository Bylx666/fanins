var $ = (el)=> document.getElementById(el);

var currentRequestCount = 0;
/**
 * request网络资源
 * 1. req(url, callback, resType) - get
 * 2. req(url, body, callback, resType) - post
 */
function req() {
  
  $('loading-symbol').style.display = 'block';
  ++currentRequestCount;

  var xhr = new XMLHttpRequest();

  if(typeof arguments[0]==='string') {

    // get
    if(typeof arguments[1]==='function') {

      if(typeof arguments[2]==='string') xhr.responseType = arguments[2];
      xhr.open('GET', arguments[0]);
      xhr.send();
      xhr.onload = ()=>{

        arguments[1](xhr.response, xhr.status);
        if(--currentRequestCount===0) {

          $('loading-symbol').style.display = 'none';

        }

      };
      return true;

    }else // post
     if(typeof arguments[1]==='object') {

      if(typeof arguments[3]==='string') xhr.responseType = arguments[3];
      xhr.open('POST', arguments[0]);
      xhr.setRequestHeader('content-type', 'application/json');
      xhr.send(JSON.stringify(arguments[1]));
      xhr.onload = ()=>{

        arguments[2](xhr.response, xhr.status);
        if(--currentRequestCount===0) {

          $('loading-symbol').style.display = 'none';

        }

      };

      return true;

    }

  }

  return false;

}

// 跳转页面
var Page = {
  status: '',
  cache: {},
  jump(pagepath, doNotPushHistory) {
    if(this.status===pagepath) return false;

    // 修改浏览器path
    if(!doNotPushHistory) {

      history.pushState(null, '', '/'+pagepath);

    }

    // 缓存
    if(this.cache[this.status]) {

      for(const func of this.cache[this.status].events.out) {
        func();
      }

    }

    var cache = this.cache[pagepath];
    if(cache) {

      $('main-container').textContent = null;
      $('main-container').append(cache.dom);
      for(const func of cache.events.in) {

        func();

      }
      this.status = pagepath;

    }else {

      req('/pages/'+pagepath+'.html', (res)=>{

        // 把dom存在内存里
        var mainDom = document.createElement('main');
        mainDom.innerHTML = res;

        // 如果在fetch里发现meta元素，说明是被跳转主页了，遂返回404
        if(mainDom.getElementsByTagName('meta').length>0) {

          if(pagepath==='404') {// 防止找不到404页面导致无限get 404文件。

            $('main-container').textContent = '找不到你要找的地方，而且甚至404文件都找不到了...';
            return false;

          }else {

            this.jump('404', true);
            return false;

          }
          
        }

        $('main-container').textContent = null;
        $('main-container').append(mainDom);

        // 处理<Script>
        var pageEvents = {
          in: [],
          out: []
        };
        // 为script的this设置page改变到这个页面时的事件管理器
        Object.defineProperty(mainDom, 'pageEvent', {value: {
          get list() {
            return pageEvents;
          },
          add: (sType ,fCallback)=> {
            // 主动执行代表第一次page到这个页面时执行
            if(sType==='in') fCallback();
            return pageEvents[sType].push(fCallback);
          },
          rm: (fCallback)=> {
            return pageEvents.splice(pageEvents.indexOf(fCallback), 1);
          }
        }});
        for(const script of mainDom.getElementsByTagName('script')) {

          new Function(script.textContent).apply(mainDom);

        }

        // 更新Page信息
        this.status = pagepath;
        this.cache[pagepath] = {
          dom: mainDom,
          events: pageEvents
        }

      });

    }

  }

};

var Bgm = {
  audio: new Audio(
    localStorage.getItem('last-play-music')
    ||'/asset/members/musics/chittychitty.mp3'
  ),
  playing: false,
  lrcTimeLine: [],
  loadLrc(src) {

    var lrcDom = $('music-container').querySelector('div').querySelector('div');
    var df = document.createDocumentFragment();

    req(src, (res, status)=> {

      if(status!==200) return false;
      try{

        var lrcArr = res.split('\n');
        var timeReg = /\[(.*)\]/;
        this.lrcTimeLine = [];
        for(const str of lrcArr) {

          const keyArr = timeReg.exec(str);
          if(!keyArr) continue;

          const key = (()=>{

            var timeArr = keyArr[1].split(':');
            var m = parseFloat(timeArr[0]);
            var s = parseFloat(timeArr[1]);
            return m * 60 + s;

          })();
          const val = str.replace(timeReg, '').trim();
          this.lrcTimeLine.push(key);
          
          var dom = document.createElement('span');
          dom.textContent = val;
          df.append(dom);

        }

        lrcDom.textContent = null;
        lrcDom.append(df);

      }catch(e) {

        throw new Error(`歌词'${src}'解析失败: ${e.message}`);

      }

    });

  },
  play(srcPrefix ,src, cover, lrc) {

    srcPrefix = srcPrefix+'.';
    if(src) {

      this.audio.src = srcPrefix + src;
      localStorage.setItem('last-play-music', srcPrefix + src);

    }
    if(cover) {

      $('music-container').children[0].src = srcPrefix + cover;
      localStorage.setItem('last-play-music-cover', srcPrefix + cover);

    }
    if(lrc) {

      this.loadLrc(srcPrefix + lrc);
      $('music-container').querySelector('div').style.display = null;

    }else if(lrc===null) {

      $('music-container').querySelector('div').style.display = 'none';

    }

    this.audio.play();
    $('music-container').classList.add('playing');
    this.playing = true;

  },
  pause() {

    this.audio.pause();
    $('music-container').classList.remove('playing');
    this.playing = false;

  }
};

// 浮窗小提示
function tip(content) {

  if(!content) content = '究竟是谁没事想提醒你下';

  var span = document.createElement('span');
  span.textContent = content;
  $('tip-container').append(span);

  span.onanimationend = ()=> {

    span.remove();

  };

}

// 确认框
function ensure(question ,cbifYes, yesAsDefaut) {

  $('ensure-container').style.display = 'block';
  $('ensure-container').querySelector('p').textContent = question;
  var yesButton = $('ensure-container').getElementsByTagName('button')[1];
  var noButton = $('ensure-container').getElementsByTagName('button')[0];
  if(yesAsDefaut) {

    noButton.classList.remove('default');
    yesButton.classList.add('default');

  }else {

    yesButton.classList.remove('default');
    noButton.classList.add('default');

  }

  yesButton.onclick = cbifYes;

}

// iife of main
void function main() {
  // 从访问路径获取页面名
  window.onload = window.onpopstate = ()=> {

    var path = location.pathname.replace('/', '') || "home";
    Page.jump(path, true);

  };

  // header events
  $('header-home').onclick = ()=> {
    
    Page.jump('home');
    document.title = '幻想与启发';

  };

  $('header-members').onclick = ()=> {

    Page.jump('members');
    document.title = '成员';

  };

  $('header-reading').onclick = ()=> {

    Page.jump('reading');
    document.title = localStorage.getItem('last-read-title')||'读文';

  };

  // 确认框
  $('ensure-container').onclick =
   $('ensure-container').querySelector('div')
   .querySelector('div').onclick = ()=> {

    $('ensure-container').style.display = 'none';

  };
  $('ensure-container').querySelector('div').onclick = (e)=> {

    e.stopPropagation();

  };
  
  // 音乐播放器
  $('music-container').onclick = ()=> {

    if(Bgm.playing) {

      Bgm.pause();

    }else {

      Bgm.play();

    }

  }

  $('music-container').onmousedown = (e)=> e.preventDefault();

  if(localStorage.getItem('last-play-music-cover')) {

    $('music-container').querySelector('img').src =
     localStorage.getItem('last-play-music-cover');

  }
  (()=>{

    Bgm.audio.loop = true;

    if(!AudioContext) return false;
    var canvas = $('music-container').querySelector('canvas');
    var ctx = canvas.getContext('2d');

    var sideLen = 150;
    var innerLen = 120;
    canvas.width = canvas.height = sideLen;

    var aCtx = new AudioContext();
    var source = aCtx.createMediaElementSource(Bgm.audio);
    var analyser = aCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(aCtx.destination);
    
    // 绘图中心
    var bufferLength = 256;
    analyser.fftSize = bufferLength;
    var waveArr = new Uint8Array(bufferLength);
    var gradient = (()=>{

      var l = sideLen/2;
      var g = ctx.createRadialGradient(l,l,l,l,l,innerLen/2);
      g.addColorStop(0, '#d8a');
      g.addColorStop(1, '#a30');
      return g;

    })();

    (function drawFrame() {

      analyser.getByteTimeDomainData(waveArr);

      var s = sideLen;// side length
      var w = (s - innerLen);// 可用宽度(width)
      var sliceDeg = 360 / bufferLength;

      ctx.clearRect(0, 0, s, s);

      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      ctx.beginPath();
      for(let i=0; i<bufferLength; i+=8) {

        const radian = sliceDeg * i * Math.PI / 180;
        ctx.lineTo(
          Math.floor((s + Math.sin(radian) * (innerLen + (waveArr[i] - 128) / 128 * w)) / 2),
          Math.floor((s - Math.cos(radian) * (innerLen + (waveArr[i] - 128) / 128 * w)) / 2)
        );

      }
      ctx.closePath();
      ctx.stroke();

      // 更新一次歌词
      var lrcDom = $('music-container').querySelector('div').children[0];
      for(let i=0; i<Bgm.lrcTimeLine.length; ++i) {

        lrcDom.children[i].style.color = null;
        if(!Bgm.lrcTimeLine[i+1]) break;
        if(Bgm.audio.currentTime > Bgm.lrcTimeLine[i]&&
          Bgm.audio.currentTime < Bgm.lrcTimeLine[i+1]) 
        {

          lrcDom.children[i].style.color = '#da8'
          lrcDom.style.transform = `translateY(${
            ($('music-container').querySelector('div').clientHeight
             - lrcDom.children[i].clientHeight) / 2
             - lrcDom.children[i].offsetTop
            }px)`;
          break;

        }

      }

      requestAnimationFrame(drawFrame);
      
    })();

  })();

}();
