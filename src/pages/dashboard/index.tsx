import Head from "next/head";
import { TextArea } from "@/src/components/textarea";
import styles from "../../../styles/dashboard.module.css";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { toast } from "react-toastify";
import { ChangeEvent, FormEvent, useState, useEffect } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/src/services/firebaseConection";
import { FaShare, FaTrash } from "react-icons/fa6";
import { BiDislike, BiLike } from "react-icons/bi";
import Link from "next/link";


interface UserProps{
    session: SessionProps;
}

interface SessionProps{
    user: {
        name: string;
        email: string;
        image: string;
    }
}

interface TasksProps {
    id: string;
    created: string;
    public: boolean;
    task: string;
    user: string;
    userImage: string;
}

interface FeedbackCounts{
    like: number;
    dislike: number;
}

export default function Dashboard({session}:UserProps){
    const [input, setInput] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [tasksInfo, setTasksInfo] = useState<TasksProps[]>();
    const [feedbacks, setFeedbacks] = useState<Record<string, FeedbackCounts>>({});

    useEffect(() => {
        const docRef = query(collection(db, "tasks"), where("user", "==", session.user.email));

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            const itemsList: TasksProps[] = [];
            snapshot.forEach((doc) => {
                itemsList.push({
                    id: doc.id,
                    created: doc.data()?.created,
                    public: doc.data().public,
                    task: doc.data().task,
                    user: doc.data().user,
                    userImage: doc.data().userImage,
                })
            })
            setTasksInfo(itemsList);
        })

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if(!tasksInfo) return;

        const unsubscribes = tasksInfo.map((task) => {
            const q = query(collection(db, "tasksFeedback"), where("taskId", '==', task.id));

            return onSnapshot(q, (snapshot) => {
                const feedbackData = snapshot.docs.map(doc => doc.data());

                const like = feedbackData.filter(item => item.like === 1).length;
                const dislike = feedbackData.filter(item => item.dislike === 1).length;

                setFeedbacks(prev => ({
                    ...prev,
                    [task.id]: { like, dislike }
                }));

                
            })
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [tasksInfo]);

    async function taskRegister(event: FormEvent){
        event.preventDefault();

        if(input === ""){
            toast.warn("Enter a valid task!");
            return;
        }
        
        try{
            await addDoc(collection(db, "tasks"), {
                task: input,
                user: session?.user?.email,
                userImage: session?.user.image,
                created: new Date(),
                public: isPublic,
            });

            setInput("");
            setIsPublic(false);
            toast.success("Task saved!");

        }catch(error){
            toast.error("Error! Try again late");
            console.log(error);
        }

    }

    async function handleShare(id: string){
        await navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL}/task/${id}`);
        toast.success("Copied");
    }


    function handlePublic(event: ChangeEvent<HTMLInputElement>){
        setIsPublic(event.target.checked);
    }

    async function handleDelete(id: string){
        
        try{
            const docRef = doc(db, "tasks", id);
            await deleteDoc(docRef);

        }catch(error){
            toast("Something was wrong!");
            console.log(error);
        }
        
    }

    return(
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <Head>Task Painel</Head>
                
                <main className={styles.mainArea}>
                    <h1>What is your task?</h1>

                    <form onSubmit={taskRegister} className={styles.formArea}>
                        <TextArea placeholder="Type your task..."
                        value={input}
                        onChange={(e :ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}/>

                        <div className={styles.buttonArea}>
                            <input id="publick" type="checkbox" checked={isPublic} onChange={handlePublic} className={styles.checkButton}/>
                            <label htmlFor="publick">Make Task Public</label>
                        </div>

                        <button type="submit" className={styles.registerButton}>Register</button>
                    </form>
                </main>
            </div>

            <div className={styles.tasksArea}>
                <h1>My Tasks</h1>

                <section className={styles.sectionArea}>
                    {tasksInfo?.map((item) => (
                        <article key={item.id}>
                            {item.public && (

                                <div className={styles.publicArea}>
                                    <h3>Public</h3>

                                    <button onClick={() => handleShare(item.id)}>
                                        <FaShare size={21} color="#3183ff"/>
                                    </button>
                                </div>
                            )}

                            <div className={styles.textArea}>
                                <h1>{item.task}</h1>

                                <button onClick={ () => handleDelete(item.id)}>
                                    <FaTrash size={20} color="#fd0800"/>
                                </button>
                            </div>

                            {item.public && (
                                <div className={styles.likeArea}>
                                    <div className={styles.likeBox}>
                                        <BiLike size={24} color="#3183ff"/>
                                        <p>{feedbacks[item.id]?.like || 0}</p>
                                    </div>

                                    <div className={styles.dislikeBox}>
                                        <BiDislike size={24} color="#f30000"/>
                                        <p>{feedbacks[item.id]?.dislike || 0}</p>
                                    </div>
                                    
                                    <Link href={`/task/${item.id}`}>
                                        <h3> Comment </h3>
                                    </Link>
                                </div>
                            )}
                        </article>      
                    ))}
                </section>
            </div>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ( {req} ) => {
    const session = await getSession( {req} );

    if(!session?.user){
        return {
            redirect:{
                destination: '/',
                permanent: false,
            }   
        }
    }

    const q = collection(db, "tasksFeedback", )

    return{
        props: {
            session: session,
        }
    }
}