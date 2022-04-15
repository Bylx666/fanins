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
      $('main-container').append(cache);
      this.status = pagepath;
    }else {
      req('/pages/'+pagepath+'.html', (res)=>{
        // 把dom存在内存里
        var mainDom = document.createElement('main');
        mainDom.innerHTML = res;

        // 如果在fetch里发现meta元素，说明是被跳转主页了，遂返回404
        if(mainDom.getElementsByTagName('meta').length>0) {
          if(pagepath==='404') {// 防止404页面找不到导致无限get 404文件。
            $('main-container').textContent = '找不到你要找的地方，而且甚至404文件都找不到了...';
            return false;
          }
          else {
            this.jump('404', true);
            return false;
          }
        }

        $('main-container').textContent = null;
        $('main-container').append(mainDom);

        // 处理<Script>
        for(const script of mainDom.getElementsByTagName('script')) {
          new Function(script.textContent).apply(mainDom);
        }

        // 更新Page信息
        this.status = pagepath;
        this.cache[pagepath] = mainDom;
      });
    }
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
    if(path==='reading') {
      if(window.refreshArticle) refreshArticle();
    }
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
  
}();
