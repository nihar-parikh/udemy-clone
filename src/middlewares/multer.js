import multer from "multer";

const storage = multer.memoryStorage();

//"file" name should be same as const file = req.file
const singleUpload = multer({ storage }).single("file");

export { singleUpload };
