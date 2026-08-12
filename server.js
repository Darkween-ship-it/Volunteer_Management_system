const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

let events =[];

app.listen(3000,()=>{
    console.log("Server running on https://local host:3000");
})

app.post('/api/events',(req, res) =>{
    const {title, date, location, description} = req.body;

    if (!title || !date) {
        return res.status(400).json({ error: "Title and date are required!" });
    }

    const newEvent = {
        id: events.length + 1,
        title,
        date,
        location: location || "TBD",
        description: description || ""
    };

    events.push(newEvent);
    res.status(201).json(newEvent);
});