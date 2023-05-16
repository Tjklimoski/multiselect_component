import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './select.module.css';

//seperate type for our options variable
export type SelectOption = {
  label: string
  value: string | number
}

type MultipleSelectProps = {
  multiple: true
  value: SelectOption[]
  onChange: (value: SelectOption[]) => void
}

type SingleSelectProps = {
  multiple?: false
  value?: SelectOption
  onChange: (value: SelectOption | undefined) => void
}

//basic type for single select selector
type SelectProps = {
  options: SelectOption[]
} & (SingleSelectProps | MultipleSelectProps)

//value is the choices the user selected that will be displayed
export default function Select({ multiple, value, onChange, options}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null);

  function clearOptions() {
    multiple ? onChange([]) : onChange(undefined);
  }

  const selectOption = useCallback((option: SelectOption) => {
    if (multiple) {
      if (value.includes(option)) {
        //remove the clicked on option from the list, value
        onChange(value.filter(o => o !== option))
      } else {
        onChange([...value, option])
      }
    } else {
      if (option !== value) onChange(option);
    }
  }, [multiple, onChange, value])

  function isOptionSelected(option: SelectOption) {
    return multiple ? value.includes(option) : option === value
  }

  useEffect(() => {
    if (isOpen) setHighlightedIndex(0)
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      //prevents our keydown events from triggering when focus or selection is on an element within our container (like the badges inside it)
      if (e.target !== containerRef.current) return;
      switch (e.code) {
        case 'Enter':
        case 'Space':
          setIsOpen(prev => !prev);
          if (isOpen) selectOption(options[highlightedIndex]);
          break;
        case 'ArrowUp':
        case 'ArrowDown': {
          if (!isOpen) {
            setIsOpen(true);
            break;
          }

          const newValue = highlightedIndex + (e.code === 'ArrowDown' ? 1 : -1);
          //prevents moving the highlight to an item that's not there.
          if (newValue >= 0 && newValue < options.length) {
            setHighlightedIndex(newValue);
          }
          break;
        }
        case 'Escape':
          setIsOpen(false);
          break;
        default:
          break;
      }
    }

    containerRef.current?.addEventListener('keydown', handler);

    return () => {
      containerRef.current?.removeEventListener('keydown', handler)
    }
  }, [isOpen, highlightedIndex, options, selectOption])

  return (
    <>
      <div 
        ref={containerRef}
        onClick={() => setIsOpen(prev => !prev)} 
        onBlur={() => setIsOpen(false)} 
        tabIndex={0} 
        className={styles.container}
      >
        <span className={styles.value}>{multiple ? value.map( option => (
          <button 
            key={option.value} 
            onClick={e => {
              e.stopPropagation();
              selectOption(option);
            }}
            className={styles["option-badge"]}
          >
            {option.label}
            <span className={styles["remove-btn"]}>&times;</span>
          </button>
        )) : value?.label}</span>
        <button onClick={e => {
          e.stopPropagation();
          clearOptions();
        }} className={styles['clear-btn']}>&times;</button>
        <div className={styles.divider}></div>
        <div className={styles.caret}></div>

        <ul className={`${styles.options} ${isOpen ? styles.show : ''}`}>
          {options.map((option, index) => (
            <li 
              onClick={e => {
                e.stopPropagation()
                selectOption(option);
                //close dropdown after item selected
                setIsOpen(false);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              key={option.value} 
              className={`${styles.option}
              ${isOptionSelected(option) ? styles.selected : ''}
              ${index === highlightedIndex ? styles.highlighted : ''}
              `}
            >
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
