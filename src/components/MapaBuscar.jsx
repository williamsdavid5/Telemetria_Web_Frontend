import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-polylinedecorator';
import { useMapEvent } from 'react-leaflet';
import { useRef } from 'react';
import api from '../server/api';
import './styles/mapa.css';
import veiculoIcon from '../assets/veiculoIcon.png';
import pontoIcon from '../assets/pontoIcon.png'
import startIcon from '../assets/startIcon.png';

import mapProviders from '../utils/mapProviders';

import ModalCerca from './ModalCerca';

//icon personalizado do veiculo
const vehicleIcon = new L.Icon({
    iconUrl: veiculoIcon,
    iconSize: [40, 40],
    iconAnchor: [15, 15],
    className: 'iconeVeiculo'
});

const pontoPercursoIcon = new L.Icon({
    iconUrl: pontoIcon, // ou apenas um link direto
    iconSize: [35, 35], // tamanho do ícone
    iconAnchor: [15, 15], // ponto do ícone que estará na coordenada
    popupAnchor: [0, -15], // onde o popup abrirá em relação ao ícone
    className: 'pontoIcon' // opcional
});

const starPercursotIcon = new L.Icon({
    iconUrl: startIcon, // ou apenas um link direto
    iconSize: [35, 35], // tamanho do ícone
    iconAnchor: [15, 15], // ponto do ícone que estará na coordenada
    popupAnchor: [0, -15], // onde o popup abrirá em relação ao ícone
    className: 'startIcon' // opcional
});

function LinhaComSetas({ pontos }) {
    const map = useMap();

    useEffect(() => {
        if (!pontos || pontos.length < 2) return;

        const latlngs = pontos.map(p => [parseFloat(p.latitude), parseFloat(p.longitude)]);

        // Linha pontilhada
        const linha = L.polyline(latlngs, {
            color: '#007bff',
            weight: 3,
            opacity: 0.7,
            dashArray: '6, 10' // padrão de linha pontilhada
        }).addTo(map);

        // Setas de direção (maiores e mais visíveis)
        const decorator = L.polylineDecorator(linha, {
            patterns: [
                {
                    offset: 25, // início da primeira seta
                    repeat: 150, // espaçamento entre setas
                    symbol: L.Symbol.arrowHead({
                        pixelSize: 16, // tamanho da seta (maior)
                        polygon: true,
                        pathOptions: {
                            color: '#007bff',
                            fillOpacity: 1,
                            weight: 1,
                            opacity: 0.9
                        }
                    })
                }
            ]
        }).addTo(map);

        return () => {
            map.removeLayer(linha);
            map.removeLayer(decorator);
        };
    }, [map, pontos]);

    return null;
}

//para que as viagens não fiquem sempre visíveis
function MapaClickReset({ setViagemSelecionada }) {
    useMapEvent('click', () => {
        // Quando o usuário clicar em qualquer parte do mapa (não em markers)
        setViagemSelecionada(null);
    });

    return null;
}

// essa função é responsável por configurar os controles padrões do leaflet, dar funções a eles
function ControladorDesenho({
    layerRefs,
    setNovaCercaCoordenadas,
    setCoordenadas,
    onReady
}) {
    const map = useMap();
    const poligoneref = useRef(null);
    const [pontosMarcados, setPontosMarcados] = useState([]);

    const ativarDesenho = () => {
        const drawPolygon = new L.Draw.Polygon(map);
        drawPolygon.enable();
    };

    useEffect(() => {
        if (!map) return;
        if (onReady) {
            onReady({
                ativarDesenho
            });
        }
    }, [map]);


    useEffect(() => {
        if (map._drawControlAdded) return;

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            draw: {
                polygon: false,
                polyline: false,
                rectangle: false,
                circle: false,
                marker: false,
                circlemarker: false,
            }
        });

        map.addControl(drawControl);
        map._drawControlAdded = true;
        map._drawnItems = drawnItems;


        map.on(L.Draw.Event.CREATED, function (event) {
            const layer = event.layer;

            if (event.layerType === 'polygon') {

                const latlngs = layer.getLatLngs()[0];
                const coordenadas = latlngs.map(coord => [coord.lat, coord.lng]);

                if (poligoneref.current) {
                    map.removeLayer(poligoneref.current);
                }

                layer.addTo(map);
                poligoneref.current = layer;

                setNovaCercaCoordenadas(coordenadas);
                setCoordenadas(coordenadas);
            }

            if (event.layerType === 'marker') {
                const { lat, lng } = layer.getLatLng();
                setPontosMarcados(prev => [...prev, [lat, lng]]);
                drawnItems.addLayer(layer);
            }
        });

    }, [map]);

    useEffect(() => {
        console.log('Pontos marcados atualizados:', pontosMarcados);
    }, [pontosMarcados]);

    return null;
};


function abrirNoMaps(lat, lng) {
    if (!lat || !lng) {
        console.warn("Coordenadas inválidas para compartilhamento.");
        return;
    }

    const url = `https://www.google.com/maps?q=${lat},${lng}`;

    // se estiver em um dispositivo mobile, tenta abrir o app do Maps
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const link = isMobile ? `geo:${lat},${lng}?q=${lat},${lng}` : url;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(url)}`;

    window.open(link, "_blank");
}

async function compartilharLocalizacao(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    const mensagem = `Veja minha localização: ${url}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Minha localização",
                text: mensagem,
                url,
            });
        } catch (err) {
            console.error("Erro ao compartilhar:", err);
        }
    } else {
        // fallback: abre WhatsApp
        const linkWhatsapp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(linkWhatsapp, "_blank");
    }
}


export default function MapaBuscar({ setCoordenadas, setDesenhar }) {

    const layerRefs = useRef({});
    const [novaCercaCoordenadas, setNovaCercaCoordenadas] = useState(null);
    const [camadas, setCamadas] = useState(false);
    const [viagens, setViagens] = useState(null);
    const [viagemSelecionada, setVIagemSelecionada] = useState(null);

    const [currentProvider, setCurrentProvider] = useState(mapProviders.default);


    function formatarDataHora(isoString) {
        const data = new Date(isoString);

        const dia = String(data.getUTCDate()).padStart(2, '0');
        const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
        const ano = data.getUTCFullYear();

        const hora = String(data.getUTCHours()).padStart(2, '0');
        const minuto = String(data.getUTCMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    }


    return (
        <div className='mapa'>
            <MapContainer center={[-3.76, -49.67]} zoom={15} style={{ height: '100vh', width: '100%' }}>
                <TileLayer
                    key={currentProvider}
                    url={mapProviders[currentProvider].url}
                    maxZoom={mapProviders[currentProvider].maxZoom}
                    attribution={mapProviders[currentProvider].attribution}
                />

                <ControladorDesenho
                    layerRefs={layerRefs}
                    setNovaCercaCoordenadas={setNovaCercaCoordenadas}
                    setCoordenadas={setCoordenadas}
                    onReady={setDesenhar}
                />

            </MapContainer>

            <div className='janelaProviders'>
                {/* select do provider */}
                <p className='pJanelaProviders'>Estilo de mapa:</p>
                <select
                    name="providerSelect"
                    id="providerSelect"
                    value={currentProvider}
                    onChange={(e) => setCurrentProvider(e.target.value)}
                    className="map-provider-select"
                >
                    {Object.entries(mapProviders)
                        .filter(([id]) => id !== 'default')
                        .map(([id, provider]) => (
                            <option key={id} value={id}>
                                {provider.name}
                            </option>
                        ))}
                </select>
            </div>

        </div>
    );
}