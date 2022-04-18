/**
 * request网络资源
 * 1. req(url, callback) - get
 * 2. req(url, body, callback) - post
 */
function req() {
  var xhr = new XMLHttpRequest();
  if(typeof arguments[0]==='string') {
    // get
    if(typeof arguments[1]==='function') {
      xhr.open('GET', arguments[0]);
      xhr.send();
      xhr.onload = ()=>{
        arguments[1](xhr.response, xhr.status);
      };
      return true;
    }else // post
     if(typeof arguments[1]==='object') {
      xhr.open('POST', arguments[0]);
      xhr.setRequestHeader('content-type', 'application/json');
      xhr.send(JSON.stringify(arguments[1]));
      xhr.onload = ()=>{
        arguments[2](xhr.response, xhr.status);
      };
      return true;
    }
  }
  return false;
}

var $ = (el)=> document.getElementById(el);

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
    var cache = this.cache[pagepath];
    if(cache) {
      $('main-container').textContent = null;
      $('main-container').append(cache.dom);
      for(const func of this.cache[this.status].events.out) {
        func();
      }
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
  audio: new Audio('/asset/members/musics/chittychitty.mp3'),
  playing: false,
  play(src, cover) {
    if(src) this.audio.src = src;
    if(cover) {
      $('music-container').children[0].src = cover;
    }
    this.audio.play();
    $('header-musicbg').style.display = 'block';
    $('music-container').classList.add('playing');
    this.playing = true;
  },
  pause() {
    this.audio.pause();
    $('header-musicbg').style.display = 'none';
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
  $('ensure-container').getElementsByTagName('p')[0].textContent = question;
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
   $('ensure-container').getElementsByTagName('div')[0]
   .getElementsByTagName('div')[0].onclick = ()=> {
    $('ensure-container').style.display = 'none';
  };
  $('ensure-container').getElementsByTagName('div')[0].onclick = e=> {
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
  (()=>{
    Bgm.audio.loop = true;
    var canvas = $('header-musicbg');
    var ctx = canvas.getContext('2d');

    window.addEventListener('resize', ()=>requestAnimationFrame(()=>{
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }));

    var aCtx = new AudioContext();
    var source = aCtx.createMediaElementSource(Bgm.audio);
    var analyser = aCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(aCtx.destination);
    
    // 绘图忠
    var bufferLength = 256;
    analyser.fftSize = bufferLength;
    var waveArr = new Uint8Array(bufferLength);

    var gradient = (()=>{
      var g = ctx.createLinearGradient(0,0,0,canvas.height);
      g.addColorStop(0, '#ff0');
      // g.addColorStop(0.33, '#00f');
      // g.addColorStop(0.67, '#f00');
      g.addColorStop(1, '#f65');
      return g;
    })();
    (function drawFrame() {
      analyser.getByteTimeDomainData(waveArr);

      var w = canvas.width;
      var h = canvas.height;
      var sliceW = w / bufferLength;

      ctx.clearRect(0, 0, w, h);

      ctx.beginPath();
      for(let i=0; i<bufferLength; ++i) {
        var sliceH = waveArr[i] / 128 * h / 2;

        ctx.rect(sliceW*i, h - sliceH, sliceW, sliceH);
      }
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.6;
      ctx.fill();

      requestAnimationFrame(drawFrame);
    })();
  })();
  

}();
