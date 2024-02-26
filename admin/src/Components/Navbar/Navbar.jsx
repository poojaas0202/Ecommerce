import React from 'react'
import "./Navbar.css"
import navlogo from "../../assets/logo_big.png"
import navProfile from "../../assets/nav_profile.png"
import dropdown from "../../assets/dropdown_icon.png"

const Navbar = () => {
  return (
    <div className='navbar'>
      <div style={{display:"flex"}}>
      <img src={navlogo} alt='' className='nav-logo' />
      <p>Admin Panel</p>
      </div>
      <div style={{display:"flex"}}>
      <img src={navProfile} alt='' className='nav-profile' />
      <img src={dropdown} alt='' className='nav-profile' />
      </div>
    </div>
  )
}

export default Navbar