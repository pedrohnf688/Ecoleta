import { Request, Response } from 'express';
import knex from '../database/conexao';

class PointController {

    async create(request: Request, response: Response) {
        const { nome, email, whatsapp, latitude, longitude, numero, cidade, estado, items } = request.body;
        
        const trx = await knex.transaction();

        const point = { 
            image: 'https://images.unsplash.com/photo-1591178579826-e8734a6c5d51?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60', 
            nome, 
            email, 
            whatsapp, 
            latitude, 
            longitude, 
            numero, 
            cidade, 
            estado 
        };

        const insertIds = await trx('points').insert(point);
    
        const point_id = insertIds[0];
    
        const pointsItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id
            }
         });
    
        await trx('points_items').insert(pointsItems);

        await trx.commit();
        
        return response.json({ id: point_id, ...point }); 
    }

    async listById(request: Request, response: Response){
        const { id }  = request.params;

        const point = await knex('points').where('id', id).first();
         
        if(!point) {
            return response.status(400).send({ message: 'Ponto não encontrado.'});
        }

        const items = await knex('items')
            .join('points_items', 'items.id', '=', 'points_items.item_id')
            .where('points_items.point_id', id)
            .select('items.title');

        return response.json({ point, items });
    }

    async list(request: Request, response: Response) {
        const { cidade, estado, items } = request.query;

        const parsedItems = String(items).split(',').map(item => Number(item.trim()));

        const points = await knex('points')
            .join('points_items', 'points.id', '=', 'points_items.point_id')
            .whereIn('points_items.item_id', parsedItems)
            .where('cidade', String(cidade))
            .where('estado', String(estado))
            .distinct()
            .select('points.*');

        return response.json(points);
    }

}

export default PointController;