module.exports = (req, res)=> {

  var d = '';
  req.on('data', (chunk)=> {
    d += chunk;
  });

  req.on('end', ()=> {

    var l = Buffer.byteLength(JSON.parse(d).content);

    res.end(l.toFixed());

  });

};