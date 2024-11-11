import React, { useState, useEffect } from 'react';
import Header from '../Header/Header'
import TurnosData from '../../Components/Admin/TurnosData/TurnosData'
import HeaderDash from '../../Components/Admin/HeaderDash/HeaderDash'
import { useLocation } from 'react-router-dom';
import SinPermisos from '../../Components/SinPermisos/SinPermisos';
import { fetchUsuario, getUsuario } from '../../Components/user';
export default function Servicios() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            await fetchUsuario(); // Llama a la función para obtener datos del usuario
            setLoading(false);
        };

        fetchData();
    }, []);

    const usuarioLegued = getUsuario();
    return (
        <div className='containerGrid'>
            <Header />

            <section className='containerSection'>

                <HeaderDash />
                <div className='container'>

                    {loading ? (
                        <></>
                    ) : usuarioLegued?.idUsuario ? (
                        <>
                            {usuarioLegued?.rol === 'admin' ? (
                                <TurnosData />
                            ) : usuarioLegued?.rol === 'colaborador' ? (
                                <TurnosData />
                            ) : (
                                <SinPermisos />
                            )}
                        </>
                    ) : (
                        <TurnosData />
                    )}

                </div>
            </section>
        </div>
    )
}

