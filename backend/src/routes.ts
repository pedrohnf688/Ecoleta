import express, { response } from 'express';
import knex from './database/conexao';
import PointController from './controller/PointController';
import ItemController from './controller/ItemController';

const routes = express.Router();
const pointController = new PointController();
const itemController = new ItemController();


routes.get('/items', itemController.list);
routes.post('/points', pointController.create);
routes.get('/points', pointController.list);
routes.get('/points/:id', pointController.listById);


export default routes;
