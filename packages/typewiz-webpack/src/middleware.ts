import { Application, Request, Response } from 'express';
import * as fs from 'fs';

export function typewizCollectorMiddleware(app: Application, outputName: string) {
    app.post('/__typewiz_report', (req: Request, res: Response) => {
        req.pipe(fs.createWriteStream(outputName));
        req.on('end', () => {
            res.send();
        });
    });
}
