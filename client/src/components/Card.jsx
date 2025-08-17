import React from 'react'
import { motion } from 'framer-motion'
export default function Card({ rank='A', suit='♠' }){
  return <motion.div>{rank}{suit}</motion.div>
}
