import MenuSuperior from "../components/MenuSuperior"
import { useState, useEffect } from "react"
import MapaBuscar from "../components/MapaBuscar"
import '../styles/buscar.css'

export default function Buscar() {

    const [coordenadas, setCoordenadas] = useState();
    const [desenhar, setDesenhar] = useState(null);

    useEffect(() => {
        console.log("coordenadas: ", coordenadas);
    })

    return (
        <>
            <main className="alertasPage">
                <div className="esquerdaAlertas">
                    <div className="topoEsquerdaAlertasPage">
                        <h2>Buscar</h2>
                        <p>Encontre motoristas e veículos que passaram em uma área específica</p>
                        <div className="pesquisaPorData">
                            <input
                                type="text"
                                placeholder="dd/mm/aaaa"
                                className="inputdataCompleto"
                                maxLength={10}
                            />
                            <span>até</span>
                            <input
                                type="text"
                                placeholder="dd/mm/aaaa"
                                className="inputdataCompleto"
                                maxLength={10}
                            />
                        </div>
                        <button className="botaoSelecionarArea" onClick={() => desenhar?.ativarDesenho()}>selecionar área</button>
                    </div>
                    <div className="divRegistros">

                    </div>
                </div>
                <div className="direitaAlertas">
                    <MapaBuscar setCoordenadas={setCoordenadas} setDesenhar={setDesenhar}></MapaBuscar>
                    <div className="divAuxiliarSombra" style={{ width: '70%' }}></div>
                </div>
            </main>
            <MenuSuperior></MenuSuperior>
        </>
    )
}