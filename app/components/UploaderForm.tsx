import React from 'react'
import type { PutBlobResult } from '@vercel/blob';
import { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import LoadingButton from './LoadingButton';
import Image from 'next/image';
import copyIcon from '../assets/copy.svg'
import doneIcon from '../assets/done.svg'

export default function UploaderForm() {
    const inputFileRef = useRef<HTMLInputElement>(null);
    const [blob, setBlob] = useState<PutBlobResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<null|string>(null);

    const copyToClipboard = React.useCallback((text:string|null)=>{
        if(text === null) return

        if (window.navigator.clipboard && window.navigator.clipboard.writeText) {
                window.navigator.clipboard.writeText(text);
        }
        else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
            var textarea = document.createElement("textarea");
            textarea.textContent = text;
            textarea.style.position = "fixed";  
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand("copy");   
            }
            catch (ex) {
                console.warn("Copy to clipboard failed.", ex);
                return prompt("Copy to clipboard: Ctrl+C, Enter", text);
            }
            finally {
                document.body.removeChild(textarea);
            }
        }
        setCopied(true)
    },[])

    const onSubmit = React.useCallback(async(event:React.FormEvent<HTMLFormElement>)=>{
        event.preventDefault();
                    
        setCopied(false)
        setIsLoading(true)
        !!blob && setBlob(null)
        !!error && setError(null)

        if (!inputFileRef.current?.files) {
            throw new Error('No file selected');
        }

        const file = inputFileRef.current.files[0];

        try{
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
    
            setBlob(newBlob);
        }catch(e){
            const err = e as {message?:string}
            setError(err?.message || "something went wrong!!!")
        }
        setIsLoading(false)
    },[])

    return (    
        <div className="max-w-md mx-auto mt-10 p-4 border rounded-md shadow-md">
            <h1 className="text-2xl font-semibold mb-6">Image Upload Form</h1>
            <form
                onSubmit={onSubmit}
            >
                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600">Select Image:</label>
                <input type="file" ref={inputFileRef} className="mt-1 p-2 w-full border rounded-md" required/>
                </div>
                <LoadingButton
                    type="submit"
                    isLoading={isLoading}
                >
                    Upload Image
                </LoadingButton>
                {
                    !!error && 
                    <p className="text-sm font-medium text-red-600 line-clamp-1 my-2">
                        {
                            error 
                        }
                    </p>
                }
            </form>
            {
                blob && (
                <div className="flex space-x-3 my-2">
                    <p className="text-sm font-medium text-gray-600 line-clamp-1 flex-grow">
                        Blob url: <a href={blob.url}>{blob.url}</a>
                    </p>
                    {
                        copied?
                        <Image className='hover:cursor-pointer fill-green-500' src={doneIcon} alt="" width={20} height={20}/>:
                        <Image className='hover:cursor-pointer' src={copyIcon} alt="" width={20} height={20} onClick={()=>copyToClipboard(blob.url)}/>
                    }
                </div>
            )}
        </div> 
    )
}
