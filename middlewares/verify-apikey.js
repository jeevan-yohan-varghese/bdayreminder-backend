function auth (req, res, next) {
    if (!req.query.apiKey){
        return res.status(401).send('Invalid API key');
    }else if(req.query.apiKey!=process.env.API_KEY){
        return res.status(401).send('Invalid API key');
    }
  
    
      next()
   
  }
  
  module.exports = auth