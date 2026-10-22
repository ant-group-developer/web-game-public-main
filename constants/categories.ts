import { Axe, Brain, CarFront, Crosshair, Gamepad2, Globe2, Heart, Mountain, Puzzle, Shirt, Sparkles, Trophy, Users, WandSparkles } from 'lucide-react';

export const categories = [
  { slug: 'multiplayer', title: '2 Player Games', icon: Users, color: '#ffba5c' },
  { slug: 'shooting', title: 'Shooting Games', icon: Crosshair, color: '#98c8ff' },
  { slug: 'skill', title: 'Skill Games', icon: WandSparkles, color: '#c6a7ff' },
  { slug: 'dress-up', title: 'Dress Up Games', icon: Shirt, color: '#ffa5cf' },
  { slug: 'car', title: 'Car Games', icon: CarFront, color: '#7ec7ed' },
  { slug: 'puzzle', title: 'Puzzle Games', icon: Puzzle, color: '#ffd769' },
  { slug: 'adventure', title: 'Adventure Games', icon: Mountain, color: '#9cdea5' },
  { slug: 'action', title: 'Action Games', icon: Axe, color: '#ff9e83' },
  { slug: 'sports', title: 'Sports Games', icon: Trophy, color: '#a9d7fc' },
  { slug: 'simulation', title: 'Simulation Games', icon: Gamepad2, color: '#b4a4f1' },
] as const;

export const quickCategories = [categories[1], categories[4], categories[0], categories[7], categories[2], categories[5]];
export const extraCategories = [
  { title: 'New Games', icon: Sparkles, href: '/?category=new' },
  { title: 'Favorite Games', icon: Heart, href: '/?category=favorites' },
  { title: 'Brain Games', icon: Brain, href: '/?category=puzzle' },
  { title: '.io Games', icon: Globe2, href: '/?category=multiplayer' },
];
