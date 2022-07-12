const https = require('https');

module.exports = (req, res)=> {

  const ghReq = https.request({
    hostname: 'api.github.com',
    port: 443,
    path: '/repos/Bylx666/fanins/contents/',
    method: 'GET',
    headers: {
      "User-Agent": "Bylx666",
      "Authorization": "token "+process.env.repo_token,
      "Accept": "application/vnd.github+json"
    }
  }, (ghRes)=>{
  
    var data = '';
  
    ghRes.setEncoding('utf8');
    ghRes.on('data', (chunk)=> {
      data += chunk;
    });
    ghRes.on('end', ()=> {
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    })
  
  });

  ghReq.end();

};
