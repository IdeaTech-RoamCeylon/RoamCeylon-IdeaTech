export interface Driver {
  id: string;
  name: string;
  coordinate: [number, number]; // [longitude, latitude]
  vehicleType: 'Car' | 'TukTuk' | 'Van' | 'Bike';
  rating: number;
}

// Mock drivers around Sri Lanka center (approx 7.8731, 80.7718)
// We'll create some variations around this point
export const MOCK_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Kamal Perera',
    coordinate: [80.7718 + 0.02, 7.8731 + 0.01],
    vehicleType: 'TukTuk',
    rating: 4.8,
  },
  {
    id: 'd2',
    name: 'Suresh De Silva',
    coordinate: [80.7718 - 0.015, 7.8731 - 0.005],
    vehicleType: 'Car',
    rating: 4.5,
  },
  {
    id: 'd3',
    name: 'Nimal Bandara',
    coordinate: [80.7718 + 0.005, 7.8731 - 0.02],
    vehicleType: 'Van',
    rating: 4.9,
  },
  {
    id: 'd4',
    name: 'Ruwan Kumara',
    coordinate: [80.7718 - 0.02, 7.8731 + 0.015],
    vehicleType: 'Bike',
    rating: 4.7,
  },
  {
    id: 'd5',
    name: 'Mahesh Gunawardena',
    coordinate: [80.7718 + 0.01, 7.8731 + 0.005],
    vehicleType: 'TukTuk',
    rating: 4.6,
  },
];
