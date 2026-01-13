import { TripPlanResponse } from '../services/aiService';

export const mockTripPlan: TripPlanResponse = {
  destination: "Polonnaruwa",
  duration: "5",
  budget: "Medium",
  itinerary: [
    {
      day: 1,
      activities: [
        { 
          description: "Arrival in Polonnaruwa and check-in to accommodation", 
          coordinate: [81.0000, 7.9400] 
        },
        { 
          description: "Lunch at a local restaurant offering traditional Sri Lankan cuisine",
          coordinate: [81.0020, 7.9420]
        },
        { 
          description: "Visit the Royal Palace Group (Royal Palace, Audience Hall, Swimming Pool)",
          coordinate: [81.0003, 7.9386]
        },
        { 
          description: "Evening stroll by the Parakrama Samudra (Sea of Parakrama)",
          coordinate: [80.9950, 7.9350]
        },
        { 
          description: "Dinner at accommodation"
        }
      ]
    },
    {
      day: 2,
      activities: [
        { 
          description: "Morning visit to the Sacred Quadrangle (Vatadage, Hatadage, Atadage)",
          coordinate: [81.0035, 7.9461]
        },
        { 
          description: "Explore the Gal Vihara rock temple and its magnificent Buddha statues",
          coordinate: [81.0045, 7.9542]
        },
        { 
          description: "Lunch near the ancient city",
          coordinate: [81.0060, 7.9500] 
        },
        { 
          description: "Visit the Rankoth Vehera and Lankatilaka Image House",
          coordinate: [81.0029, 7.9525]
        },
        { 
          description: "Sunset viewing at Thivanka Image House",
          coordinate: [81.0055, 7.9620]
        },
        { 
          description: "Dinner at a local eatery"
        }
      ]
    },
    {
      day: 3,
      activities: [
        { 
          description: "Day trip to Minneriya National Park for an elephant safari",
          coordinate: [80.8250, 8.0300]
        },
        { 
          description: "Lunch inside the park or nearby",
          coordinate: [80.8300, 8.0350]
        },
        { 
          description: "Visit the Polonnaruwa Archaeological Museum to learn about the history",
          coordinate: [80.9998, 7.9370]
        },
        { 
          description: "Relaxing evening at the hotel"
        },
        { 
          description: "Special dinner with cultural show (if available)"
        }
      ]
    },
    {
      day: 4,
      activities: [
        { 
          description: "Cycle tour around the ancient city ruins",
          coordinate: [81.0010, 7.9400]
        },
        { 
          description: "Visit the Pabalu Vehera and other smaller stupas",
          coordinate: [81.0040, 7.9480]
        },
        { 
          description: "Lunch at a cafe with a view of the ruins",
          coordinate: [81.0050, 7.9450]
        },
        { 
          description: "Visit the Parakrama Samudra bund and statue of King Parakramabahu",
          coordinate: [80.9900, 7.9380]
        },
        { 
          description: "Shopping for souvenirs and local crafts",
          coordinate: [81.0100, 7.9400]
        },
        { 
          description: "Dinner at a lakeside restaurant",
          coordinate: [80.9920, 7.9360]
        }
      ]
    },
    {
      day: 5,
      activities: [
        { 
          description: "Morning yoga or relaxation"
        },
        { 
          description: "Breakfast and check-out"
        },
        { 
          description: "Visit the Somawathie Chaitiya (optional short trip)",
          coordinate: [81.1000, 8.0500]
        },
        { 
          description: "Departure from Polonnaruwa"
        }
      ]
    }
  ]
};
