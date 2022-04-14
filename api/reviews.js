const client = require('./db');

module.exports = (request, response)=>{
  var aid;
  if(request.body) {
    aid = request.body.aid;
  }else if(request.query) {
    aid = request.query.aid;
  }

  if(!aid) {
    response.status(403);
    response.json({error: "未指定文章id"});
    return false;
  }

  client.connect(err => {
    var collection = client.db("reviews").collection(aid);
    if(request.method==='GET') {
      collection.find().sort({t: -1}).toArray().then((result)=>{
        response.json(result);
      })
    }else if(request.method==='POST') {
      if(!request.body) return false;
      var nickname = request.body.nickname || "无名";
      var qq = request.body.qq || null;
      var content = request.body.content || "被黑客动了手脚的句子";
      collection.insertOne({
        t: Date.now(), 
        n: nickname, 
        q: qq,
        c: content
      }).then(()=>{
        response.json({status: "ok"});
      });
    }
  });
};
