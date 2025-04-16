import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { resolve } from 'path';

export const uploadConfig = {
  storage: diskStorage({
    destination: resolve(__dirname, '..', '..', 'uploads'),
    filename: (req, file, callback) => {
      const uniqueSuffix = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueSuffix);
    },
  }),

  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const isValid = file.mimetype.match(/\/(jpg|jpeg|png)$/);

    if (!isValid) {
      return callback(null, false); // silencioso
    }

    callback(null, true);
  },

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
