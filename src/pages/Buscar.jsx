import MenuSuperior from "../components/MenuSuperior"
import { useState, useEffect } from "react"
import MapaBuscar from "../components/MapaBuscar"

export default function Buscar() {

    return (
        <>
            <main className="alertasPage">
                <div className="esquerdaAlertas">
                    <div className="topoEsquerdaAlertasPage">
                        <h2>Buscar</h2>
                        <p>Encontre motoristas e veículos que passaram em uma área específica</p>
                        <div className="pesquisaPorData">

                        </div>
                    </div>

                </div>
                <div className="direitaAlertas">
                    <MapaBuscar></MapaBuscar>
                    <div className="divAuxiliarSombra" style={{ width: '70%' }}></div>
                </div>
            </main>
            <MenuSuperior></MenuSuperior>
        </>
    )
}