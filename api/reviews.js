const client = require('./db');
const { ObjectId } = require('mongodb');

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
        if(request.query) {// 管理员显示_id
          if(process.env.admin&&request.query.admin===process.env.admin) {
            response.json(result);
            return true;
          }
        }
        for(let i=0; i<result.length; ++i) {
          delete result[i]._id;
        }
        response.json(result);
      });
    }else if(request.method==='POST') {
      if(!request.body) return false;
      if(request.body.action) {
        if(request.body.action==='delete') {// 删评行为！
          const reviewId = request.body.reviewId;
          if(!reviewId) {
            response.status(403);
            response.json({error: '未提供删除目标id'});
            return false;
          }
          collection.deleteOne({_id: ObjectId(reviewId)}).then((result)=>{
            response.json(result);
          });
        }else {
          response.status(400);
          response.json({error: '你要做什么？'});
          return false;
        }
      }else {// 如果不指定行为则为上传
        var id = 1;
        var nickname = request.body.nickname || "无名";
        var qq = request.body.qq;
        var content = request.body.content || "被黑客动了手脚的句子";
        var reply = request.body.reply;
        collection.findOne({},{sort: {t: -1}}).then((result)=>{
          id = result.id + 1 || 1;
          var insertObject = {
            id: id,
            t: Date.now(), 
            n: nickname, 
            c: content
          };
          if(qq) insertObject.q = qq;
          if(reply) insertObject.r = reply;

          return collection.insertOne(insertObject);
        }).then((result)=>{
          var insertedId = result.insertedId.toString();
          if(insertedId) {
            response.json({status: "ok", reviewId: insertedId, id: id});
          }else {
            response.status(500);
            response.json({error: result});
          }
        });
      }
    }
  });
};
