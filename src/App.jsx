import React, { useState, useEffect, useMemo } from "react";
import Planeta from "./Planeta";

function App() {
  const [distancia, setDistancia] = useState(0);
  const [combustible, setCombustible] = useState(100);
  const [estadoNave, setEstadoNave] = useState("En órbita");
  const [planetasVisitados, setPlanetasVisitados] = useState([]);

  useEffect(() => {
    console.log("¡El panel de control está listo!");

    const intervalo = setInterval(() => {
      setDistancia((d) => d + 10);
      setCombustible((c) => (c > 0 ? c - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(intervalo);
      console.log("El panel de control se ha apagado.");
    };
  }, []);

  useEffect(() => {
    console.log("¡Combustible actualizado!");
  }, [combustible]);

  const mensajeEstado = useMemo(() => {
    return `Estado actual: ${estadoNave}`;
  }, [estadoNave]);

  const aterrizar = () => {
    setEstadoNave("Aterrizando");
    const nuevoPlaneta = `Planeta-${planetasVisitados.length + 1}`;
    setPlanetasVisitados([...planetasVisitados, nuevoPlaneta]);
  };

  return (
    <div style={{ fontFamily: "Arial", maxWidth: "600px", margin: "auto" }}>
      <h1>Panel de Control</h1>
      <p>Distancia: {distancia} km</p>
      <p>Combustible: {combustible}%</p>
      <p>{mensajeEstado}</p>
      <button onClick={aterrizar}>Aterrizar</button>

      <h2> Planetas Visitados</h2>
      {planetasVisitados.map((planeta, index) => (
        <Planeta key={index} nombre={planeta} />
      ))}
    </div>
  );
}

export default App;
