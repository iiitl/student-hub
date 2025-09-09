import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
      cb(null, path.join(process.cwd(),"public","uploads"))
    },
    filename: function (_req, file, cb) {
      const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1e9);
      cb(null,uniqueSuffix+'-'+file.originalname)
    }
})
  
export const upload = multer({ 
    storage, 
    limits:{
      fileSize:10*1024*1024
    }
})