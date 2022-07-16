const client = require('./db');

module.exports = (req, res)=> {
  
  client.connect(()=> {

    var col = client.db('fanins').collection('arti');

    if(req.method==='GET') {
  
      col.find().toArray().then((r)=> {

        for(let i = 0; i < r.length; ++i) {

          delete r[i]._id;

        }

        res.json(r);
        
      });
      
    }
    else if(req.method==='POST') {
  
      var reqb = '';
      req.on('data', (chunk)=> {
    
        reqb += chunk;
    
      });
      req.on('end', ()=> {
    
        reqb = JSON.parse(reqb);
    
        if(reqb.admin!==process.env.admin) {
    
          res.json({ 'error': '管理员密码不对哦♪' });
    
          return false;
    
        }
    
        col.updateOne({ 'id': reqb.id }, { '$set': reqb.c }).then((r)=> {
    
          res.json(r);
    
        });
    
      });
    }

  });
  
};
