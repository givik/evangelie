'use client'
import { useEffect, useRef, useState } from 'react';
import CustomScroll from '@/components/CustomScroll';
import './styles.css'

const Dropdown = (props) => {
  const [selected, setSelected] = useState('');
  const dropdownRef = useRef(null);

  const handleClickOutside = (e) => {
    if (!dropdownRef.current.contains(e.target)) {
      document.getElementById('drop').checked = false;
    }
  };

  const handleItemClick = (e) => {
    setSelected(e.target.textContent);
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="dropdown-menu">
      <label htmlFor="drop" className="toggle">{selected || props.children[0] ||props.name}</label>
      <input type="checkbox" id="drop" />
      <ul className="menu" onClick={handleItemClick}>
        <CustomScroll height="300px">
          {props.children.map((child, index) => (
            <li key={index}><a href="#">{child}</a></li>
          ))}
        </CustomScroll>
      </ul>
    </div>
  );
};

export default Dropdown;

