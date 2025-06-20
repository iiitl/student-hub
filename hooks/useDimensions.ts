import { useEffect, useState } from 'react';

const useDimensions = () =>{
    const [dimension, setDimension] = useState({width:0, height:0});

    const updateDimensions = ()=>{
        const {innerWidth, innerHeight} = window;
        setDimension({width: innerWidth, height: innerHeight});
    }

    useEffect(()=>{
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        
        return () => {
            window.removeEventListener('resize', updateDimensions);
        }
    }, []);

    return dimension;
}

export default useDimensions;