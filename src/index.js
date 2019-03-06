import './force-graph.css';
import axios from 'axios/dist/axios'

export { default } from "./force-graph";

window.axios = axios

axios.get('http://localhost:8080/data/1').then(req => {
	console.log('req: ', req.data)
})
