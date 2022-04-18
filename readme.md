# Fanins
「幻想与启发」 - Fantasy & Inspiration, Fanins取自两单词的前三字母。

## 自豪的技术
本网站以很短的原生js代码实现了页面管理系统，并创造性的使用`new Function(dom里的script源码).apply(dom)`实现了在页面里编程时使用this定位自己。同时在页面自身的dom对象上拓展了`pageEvent`对象，使页面内编程可以使用`this.pageEvent.add(function(){...})`实现主页面跳转到自己时触发函数。

页面管理系统总体思路大致为：
1. 第一次跳转: 使用xhr获取页面
2. 创建main元素，并把ajax结果作为其innerHTML
3. 扩展这个元素，加入pageEvent对象
4. 将this绑定为这个元素，然后遍历script执行
5. 将这个元素放进全局Page对象的cache里
6. 在第二次跳转页面的时候将main-container的textContent清空，然后将cache里dom append到main-container

将dom完全储存到内存里是我学习浏览器编程技术的极大突破，特此记录。具体思路请看[`main.js`](main.js)

## 网站由来
崩坏三有个舰团群，我给群友们写了个网站，用于发布长文章和交流
