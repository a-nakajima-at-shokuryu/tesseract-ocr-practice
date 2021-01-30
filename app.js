// We declared all our imorts 
const express = require('express');
const app = express();
const fs = require('fs');
const multer = require('multer');
const { createWorker, setLogging } = require('tesseract.js');

setLogging(true);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  }, 
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }, 
});

const upload = multer({ storage }).single('avatar');

app.set('view engine', 'ejs');


// ROUTES
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', (req, res) => {
  upload(req, res, async err => {
    if (err) {
      throw err;
    }
    const data = fs.readFileSync(`./uploads/${req.file.originalname}`);

    const worker = createWorker({
      logger: m => console.log(m), 
    });
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    try {
      const { data: { text } } = await worker.recognize(data, {
        // rectangle: { top: 10, left: 10, width: 200, height: 100}, 
      });
      
      const { data: pdf } = await worker.getPDF('Tesseract OCR Result');
      fs.writeFileSync(`${__dirname}/result.pdf`, Buffer.from(pdf));
      
      res.redirect('/download');

    } catch (err) {
      console.log('This is your error', err);
    }
    finally {
      worker.terminate();
    }
  });
});

app.get('/download', (req, res) => {
  const file = `${__dirname}/result.pdf`;
  res.download(file);
});

// Start up our server 
const PORT = 5000 || process.env.PORT; 
app.listen(PORT, () => {
  console.log(`Hey I'm runngin on port ${PORT}...`)
})
