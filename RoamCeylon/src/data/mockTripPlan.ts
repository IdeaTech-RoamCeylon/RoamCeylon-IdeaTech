import { TripPlanResponse } from '../services/aiService';

export const mockTripPlan: TripPlanResponse = {
  destination: "Polonnaruwa",
  duration: "5",
  budget: "Medium",
  itinerary: [
    {
      day: 1,
      activities: [
        "Arrival in Polonnaruwa and check-in to accommodation",
        "Lunch at a local restaurant offering traditional Sri Lankan cuisine",
        "Visit the Royal Palace Group (Royal Palace, Audience Hall, Swimming Pool)",
        "Evening stroll by the Parakrama Samudra (Sea of Parakrama)",
        "Dinner at accommodation"
      ]
    },
    {
      day: 2,
      activities: [
        "Morning visit to the Sacred Quadrangle (Vatadage, Hatadage, Atadage)",
        "Explore the Gal Vihara rock temple and its magnificent Buddha statues",
        "Lunch near the ancient city",
        "Visit the Rankoth Vehera and Lankatilaka Image House",
        "Sunset viewing at Thivanka Image House",
        "Dinner at a local eatery"
      ]
    },
    {
      day: 3,
      activities: [
        "Day trip to Minneriya National Park for an elephant safari",
        "Lunch inside the park or nearby",
        "Visit the Polonnaruwa Archaeological Museum to learn about the history",
        "Relaxing evening at the hotel",
        "Special dinner with cultural show (if available)"
      ]
    },
    {
      day: 4,
      activities: [
        "Cycle tour around the ancient city ruins",
        "Visit the Pabalu Vehera and other smaller stupas",
        "Lunch at a cafe with a view of the ruins",
        "Visit the Parakrama Samudra bund and statue of King Parakramabahu",
        "Shopping for souvenirs and local crafts",
        "Dinner at a lakeside restaurant"
      ]
    },
    {
      day: 5,
      activities: [
        "Morning yoga or relaxation",
        "Breakfast and check-out",
        "Visit the Somawathie Chaitiya (optional short trip)",
        "Departure from Polonnaruwa"
      ]
    }
  ]
};
