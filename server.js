const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

let events =[];

app.listen(3000,()=>{
    console.log("Server running on https://local host:3000");
})

app.post('/api/events',(req, res) =>{
    const {title, date, location, description} = req.body;

    if (!title || !date) {
        res.status(400).json({ error: "Title and date are recquired!"})
    }

    const newEvents = {
        id: events.lenght + 1,
        title: title,
        date: date,
        location: location || "TBD" , description ||
    }
}
)