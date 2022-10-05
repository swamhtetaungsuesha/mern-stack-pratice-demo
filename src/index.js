import React, { useEffect,useState } from "react";
import {createRoot} from 'react-dom/client'
import Axios from 'axios'
import CreateNewForm from "./components/CreateNewForm";
import AnimalCard from "./components/AnimalCard";

function App(){
    
    const [animals,setAnimals] =useState([])
    useEffect(()=>{
        async function go(){
            const res = await Axios.get('/api/animals')
            setAnimals(res.data)
        }
        go()
    },[])
    return(
        <div className="container">
            <p><a href="/">&laquo; Back to public homepage</a></p>
            <CreateNewForm setAnimals={setAnimals}/>
            <div className="animal-grid">

                {
                    animals.map(animal=>(
                        <AnimalCard key={animal._id} name={animal.name} species={animal.species} id={animal._id} photo={animal.photo} setAnimals={setAnimals}/>
                    ))
                }
            </div>
        </div>
    )
}



const root = createRoot(document.querySelector('#app'))
root.render(<App/>)