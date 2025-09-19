import React, { HTMLProps } from 'react';
import style from './textarea.module.css';


export function TextArea({...props}: HTMLProps<HTMLTextAreaElement>){
    return(
        <textarea className={style.textArea} {...props} ></textarea>
    )
}