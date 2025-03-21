import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 3002;

app.use(cors());
app.use(bodyParser.json());

app.post('/generate-itinerary', async (req: any, res: any) => {
  try {
    const { location, days, transportModes } = req.body;
    
    console.log('Generating itinerary for:', location.address);
    
    // Format the prompt for Llama
    const prompt = `Generate a detailed ${days}-day travel itinerary for exploring ${location.address}. 
    Transportation modes: ${transportModes.join(', ')}.
    For each day, include:
    - A list of 4-6 places to visit
    - Estimated duration at each place
    - Brief descriptions
    - Start and end times
    - Total distance and duration
    Format as JSON with this structure:
    {
      "itineraries": [
        {
          "day": 1,
          "totalDistance": "X km",
          "totalDuration": "X hours",
          "startTime": "9:00 AM",
          "endTime": "5:00 PM",
          "places": [
            {
              "name": "Place Name",
              "description": "Brief description",
              "duration": "X hours",
              "address": "Address",
              "type": "attraction/food/outdoor/accommodation",
              "coordinates": {"lat": X, "lng": Y}
            }
          ]
        }
      ]
    }`;

    console.log('Calling Ollama API...');
    
    // Call Ollama API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt: prompt,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from Ollama');
    
    try {
      // Extract JSON from the output
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in output');
        return generateMockItinerary(location, days, res);
      }
      
      const jsonOutput = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed JSON response');
      res.json(jsonOutput);
    } catch (error) {
      console.error('Error parsing LLM output:', error);
      // Fallback to mock data
      generateMockItinerary(location, days, res);
    }
  } catch (error) {
    console.error('Error:', error);
    // Fallback to mock data
    generateMockItinerary(location, days || 1, res);
  }
});

// Fallback function to generate mock data
function generateMockItinerary(location: any, days: any, res: any) {
  console.log('Falling back to mock data');
  
  const itineraries = Array(parseInt(days)).fill(null).map((_, dayIndex) => ({
    day: dayIndex + 1,
    totalDistance: `${(Math.random() * 10 + 5).toFixed(1)} km`,
    totalDuration: `${Math.floor(Math.random() * 4 + 5)} hours`,
    startTime: '9:00 AM',
    endTime: `${Math.floor(Math.random() * 3 + 4)}:00 PM`,
    places: [
      {
        name: 'Local Cafe',
        description: 'Start your day with a traditional breakfast',
        duration: '45 min',
        address: '123 Sample Street, ' + location.address,
        type: 'food',
        coordinates: {
          lat: location.coordinates.lat + (Math.random() * 0.02 - 0.01),
          lng: location.coordinates.lng + (Math.random() * 0.02 - 0.01),
        },
      },
      {
        name: 'Historic Museum',
        description: 'Explore local history and culture',
        duration: '2 hours',
        address: '456 History Lane, ' + location.address,
        type: 'attraction',
        coordinates: {
          lat: location.coordinates.lat + (Math.random() * 0.02 - 0.01),
          lng: location.coordinates.lng + (Math.random() * 0.02 - 0.01),
        },
      },
      {
        name: 'City Park',
        description: 'Relax and enjoy nature in the heart of the city',
        duration: '1 hour',
        address: '789 Park Avenue, ' + location.address,
        type: 'outdoor',
        coordinates: {
          lat: location.coordinates.lat + (Math.random() * 0.02 - 0.01),
          lng: location.coordinates.lng + (Math.random() * 0.02 - 0.01),
        },
      },
      {
        name: 'Local Restaurant',
        description: 'Lunch break with local specialties',
        duration: '1 hour',
        address: '321 Food Street, ' + location.address,
        type: 'food',
        coordinates: {
          lat: location.coordinates.lat + (Math.random() * 0.02 - 0.01),
          lng: location.coordinates.lng + (Math.random() * 0.02 - 0.01),
        },
      },
    ],
  }));

  res.json({ itineraries });
}

app.listen(port, () => {
  console.log(`LLM server running at http://localhost:${port}`);
  console.log(`Using Ollama for LLM inference`);
}); 