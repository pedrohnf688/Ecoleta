import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import './styles.css';
import logo from '../../assets/logo.svg';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

interface Item {
    id: number,
    title: string,
    image_url: string
}

interface IBGEEstadoResponse {
    sigla: string
}

interface IBGECidadeResponse {
    nome: string
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [estados, setEstados] = useState<string[]>([]);
    const [selectedEstado, setSelectedEstado] = useState('0');
    const [cidades, setCidades] = useState<string[]>([]);
    const [selectedCidade, setSelectedCidade] = useState('0');    
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        whatsapp: '',
        numero: ''
    });
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const history = useHistory();

    useEffect(() => {
        api.get('items').then(res => {
            setItems(res.data);
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEEstadoResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(res => {
            const nomesEstados = res.data.map(n => n.sigla);
            setEstados(nomesEstados);
        });
    }, []);

    useEffect(() => {
        if(selectedEstado === '0'){
            return;
        }
        axios.get<IBGECidadeResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedEstado}/municipios`).then(res => {
            const nomesCidades = res.data.map(n => n.nome);
            setCidades(nomesCidades);
        });        
    }, [selectedEstado]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            setInitialPosition([position.coords.latitude, position.coords.longitude]);
        })
    }, []);

    function handleSelectedEstado(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedEstado(event.target.value);
    }

    function handleSelectedCidade(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCidade(event.target.value);
    }

    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([event.latlng.lat, event.latlng.lng]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        
        setFormData({ ...formData, [name]: value })
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([ ...selectedItems, id ]);
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const { nome, email, whatsapp, numero } = formData;
        const estado = selectedEstado;
        const cidade = selectedCidade;
        const [ latitude, longitude ] = selectedPosition;
        const items = selectedItems;

        const data = { nome, email, whatsapp, numero, estado, cidade, latitude, longitude, items };

        await api.post('points', data).then(res => {
            console.log(res);
        }).catch(error => {
            console.log(error);
        });

        alert('Ponto de Coleta Criado!');

        history.push('/');

    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
                <Link to="/">
                    <FiArrowLeft/>
                    Voltar para home
                </Link>
            </header>
 
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="nome">Nome da entidade</label>
                        <input type="text" name="nome" id="nome" onChange={handleInputChange}/>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={handleInputChange} />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
                        </div>
                    </div>

                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
                        <TileLayer attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

                        <Marker position={selectedPosition} />
                    </Map>


                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="numero">Número</label>
                            <input type="number" name="numero" id="numero"  onChange={handleInputChange} />
                        </div>
                        <div className="field">
                            <label htmlFor="cidade">Cidade</label>
                            <select name="cidade" id="cidade" value={selectedCidade} onChange={handleSelectedCidade}>
                                <option value="0">Selecione uma cidade</option>
                                {cidades.map(cidade => (
                                    <option key={cidade} value={cidade}>{cidade}</option>    
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="field">
                        <label htmlFor="estado">Estado</label>
                        <select name="estado" id="estado" value={selectedEstado} onChange={handleSelectedEstado}>
                            <option value="0">Selecione um estado</option>
                            {estados.map(estado => (
                                <option key={estado} value={estado}>{estado}</option>
                            ))}
                        </select>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Itens de coleta</h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => ( 
                        <li key={item.id} onClick={() => handleSelectItem(item.id)} 
                            className={selectedItems.includes(item.id) ? 'selected' : ''}>
                            <img src={item.image_url} alt={item.title}/>
                            <span>{item.title}</span>
                        </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    );
}

export default CreatePoint;