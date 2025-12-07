import multer, { Multer } from 'multer';
import { Request } from 'express';

// Configura o armazenamento para o Multer
const storage = multer.memoryStorage(); // Armazena arquivos na memória como buffers

// Filtro de arquivo para aceitar apenas imagens
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(null, false); // Altera para null para o argumento de erro
    }
};

// Inicializa o upload do Multer
export const uploadVehicleImages = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).array('images', 10); // Máximo de 10 imagens, 10MB cada
