/**
 * get网络资源
 * @param {string} url 目标链接
 * @param {function} cb 回调函数(response, status)
 */
function get(url, cb) {
  var xhr = new XMLHttpRequest();
  xhr.open('get', url);
  xhr.send();
  xhr.onload = ()=>{
    cb(xhr.response, xhr.status);
  };
}

var $ = (el)=> document.getElementById(el);

// 跳转页面
var Page = {
  status: '',
  cache: {},
  jump(pagepath, doNotPushHistory) {
    if(this.status===pagepath) return false;

    // 缓存
    var cache = this.cache[pagepath];
    if(cache) {
      $('main-container').textContent = null;
      $('main-container').append(cache);
      this.status = pagepath;
      if(!doNotPushHistory) {
        history.pushState(pagepath, '', '/'+pagepath);
      }
    }else {
      get('/pages/'+pagepath+'.html', (res, status)=>{
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
        this.status = pagepath;
        if(!doNotPushHistory) {
          history.pushState(pagepath, '', '/'+pagepath);
        }
        this.cache[pagepath] = mainDom;
      });
    }
  }
};

// iife of main
void function main() {
  // 从访问路径获取页面名
  window.onload = window.onpopstate = ()=> {
    var path = location.pathname.replace('/', '') || "home";
    Page.jump(path, true);
  };

  // header events
  $('header-home').onclick = ()=> Page.jump('home');
  $('header-members').onclick = ()=> Page.jump('members');
}();
