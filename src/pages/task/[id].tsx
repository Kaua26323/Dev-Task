import { TextArea } from "@/src/components/textarea";
import styles from "./style.module.css";
import { GetServerSideProps } from "next";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "@/src/services/firebaseConection";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { FaRegTrashAlt } from "react-icons/fa";
import { BiSolidDislike, BiSolidLike } from "react-icons/bi";


interface TaskCommentProps{
    item: {
        task: string;
        taskId: string;
        user:  string;
        userImage: string;
        created: string;
    }
    allComments: CommentsProps[];
    allFeedbacks: FeedbackProps[];
}

interface CommentsProps{
    id: string;
    comment: string;
    taskId: string;
    created: string;
    userName: string;
    userEmail: string;
    userImage: string;
}

interface FeedbackProps{
    like: number;
    dislike: number;
    taskId: string;
    user: string;
}

export default function TaskComment({item, allComments, allFeedbacks}: TaskCommentProps){
    const { data: session } = useSession();
    const [input, setInput] = useState("");
    const [comment, setComment] = useState<CommentsProps[]>(allComments || []);
    const [feedback, setFeedback] = useState<FeedbackProps[]>(allFeedbacks || []);
    const [like, setLike] = useState<number>(0);
    const [dislike, setDislike] = useState<number>(0);
    const [isActive, setIsActive] = useState<"like" | "dislike" | null>(null);
    const [isPending, setIsPending] = useState<boolean>(false);

    useEffect(() => {
        function readFeedbacks(){
            const likes = feedback.reduce((acc, value) => {
                return acc + value.like;
            }, 0);

            setLike(likes);

            const dislikes = feedback.reduce((acc, value) => {
                return acc + value.dislike;
            }, 0);
            setDislike(dislikes);
        };

        function checkingFeedbacks(){
            const userFeedback = feedback.find(user => user.user === session?.user?.email);
            if(userFeedback){
                if(userFeedback.like === 1){
                    setIsActive("like");
                }else if(userFeedback.dislike === 1){
                    setIsActive("dislike");
                }
            }
        }
        
        checkingFeedbacks();
        readFeedbacks();
    }, [feedback, session?.user?.email]);
    

    async function handleLike(id: string){

        if(!session?.user?.email){
            toast.warn("Log in first");
            return;
        }

        try{
             const docRef = doc(db, "tasksFeedback", `${id}_${session.user?.email}`);
             await setDoc(docRef, {
                like: 1,
                dislike: 0,
                user: session?.user?.email || null,
                taskId: id,
            });

            setFeedback((oldItems) => {
                const filtered = oldItems.filter(oldI => oldI.user !== session?.user?.email);
                return [...filtered, {
                    like: 1,
                    dislike: 0,
                    user: session?.user?.email || "dont have",
                    taskId: id,
                }]
            });

            setIsActive("like");

        }catch(error){
            toast.error("Algo deu errado!");
            console.log(error);
        };
       
    }

    async function handleDislike(id: string){

        if(!session?.user?.email){
            toast.warn("Log in first");
            return;
        };

        try{
        
             const docRef = doc(db, "tasksFeedback", `${id}_${session.user?.email}`);
             await setDoc(docRef, {
                like: 0,
                dislike: 1,
                user: session?.user?.email || "dont have",
                taskId: id,
            });

            setFeedback((oldItems) => {
                const filtered = oldItems.filter(oldI => oldI.user !== session.user?.email);

                return [...filtered, {
                    like: 0,
                    dislike: 1,
                    user: session?.user?.email || "dont have",
                    taskId: id,
                }]
            });

            setIsActive("dislike");
            
        }catch(error){
            toast.error("Something went wrong!");
            console.log(error);
        };
    }

    async function registerComment(event: FormEvent){
        event.preventDefault();
        setIsPending(true);

        if(input === ""){
            toast.error("Type a valid comment!");
            return;
        }

        if(!session?.user?.name || !session?.user?.email){
            toast.error("Log in to comment");
        }
        
        try{
            const docRef = collection(db, "comments");

            await addDoc(docRef, {
                comment: input,
                taskId: item.taskId,
                created: new Date(),
                userName: session?.user?.name,
                userEmail: session?.user?.email,
                userImage: session?.user?.image,
            });

            let data = {
                id: docRef.id,
                comment: input,
                taskId: item.taskId,
                created: new Date().toLocaleDateString(),
                userName: session?.user?.name ?? "",
                userEmail: session?.user?.email ?? "",
                userImage: session?.user?.image ?? "https://via.placeholder.com/150",
            };

            setComment((oldItems) => [...oldItems, data]);

            setInput("");
            setIsPending(false);

        }catch(error){
            toast.error("something was wrong! try again");
            console.log(error);
        }
    }

    async function deleteComment(id: string){

        try{
            const docRef = doc(db, "comments", id);
            await deleteDoc(docRef);
            
            const filter = comment.filter(item => item.id !== id);

            setComment(filter);

        }catch(error){
            toast.error("Error");
            console.log(error);
        }
        toast.success("Deleted");
    }

    return(
        <div className={styles.container}>
            <main className={styles.mainArea}>

                <div className={styles.taskText}>
                    <h1>Task</h1>
                    <p>{item.task}</p>
                    <div className={styles.likesArea}>
                        <div className={styles.likeBox}>
                            <button onClick={() => handleLike(item.taskId)}>
                            <BiSolidLike size={30} className={isActive === "like" ? styles.activeLikeButton : styles.likeButton}/>
                            </button>

                            <h3>{like}</h3>
                        </div>

                        <div className={styles.dislikeBox}>
                            <button onClick={() => handleDislike(item.taskId)}>
                                <BiSolidDislike size={30} className={isActive === "dislike" ? styles.activeDislikeButton :styles.deslikeButton}/>
                            </button>

                            <h3>{dislike}</h3>
                        </div>
                    </div>
                </div>

                <form onSubmit={registerComment} className={styles.formArea}>
                    <h1>Leave a Comment</h1>
                    <TextArea placeholder="Type your comment"
                    value={input}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}/>

                    {session?.user ? (
                        <button type="submit" disabled={isPending}> Send Comment</button>
                    ) : (
                        <button disabled>Log in to comment</button>
                    )}

                </form>

                <div className={styles.commentArea}>
                    <h1>All Comments</h1>

                    {comment && comment.map((item) => (
                        <article key={item.id} className={styles.articleArea}>

                            <img src={item.userImage} alt="account image"/>
                            
                            <div className={styles.commentBox}>

                                <div className={styles.userInfo}>
                                    <h3>{item.userName}</h3>

                                    {item.userEmail === session?.user?.email && (
                                        <button onClick={() => deleteComment(item.id)}>
                                            <FaRegTrashAlt color="#d10000" size={23}/>
                                        </button>
                                    )}
                                </div>

                                <p>{item.comment}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </main>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ( {params} ) => {
    const id = params?.id as string;

    const docRef = doc(db, "tasks", id);
    const snapShot = await getDoc(docRef);

    if(snapShot.data() === undefined){
        return{
            redirect: {
                destination: '/',
                permanent: false,
            }
        }
    };

    if(!snapShot.data()?.public){
        return{
            redirect: {
                destination: '/',
                permanent: false,
            }
        }
    }

    const miliseconds = snapShot.data()?.created.seconds * 1000;

    const taskInfo = {
        task: snapShot.data()?.task,
        taskId: id,
        user: snapShot.data()?.user,
        userImage: snapShot.data()?.userImage,
        created: new Date(miliseconds).toLocaleDateString(),
    }

    const q = query(collection(db, "comments"), where("taskId", "==", id));
    const snapShotComment = await getDocs(q);
    const allComments = [] as CommentsProps[];

    

    snapShotComment.forEach((item) => {
        const commentMiliseconds = item.data().created.seconds * 1000;

        allComments.push({
            id: item.id,
            comment: item.data()?.comment,
            taskId: item.data()?.taskId,
            created: new Date(commentMiliseconds).toLocaleDateString(),
            userName: item.data()?.userName,
            userEmail: item.data()?.userEmail,
            userImage: item.data()?.userImage ?? 'https://via.placeholder.com/150',
        });
    });

    const feedbackQ = query(collection(db, "tasksFeedback"), where("taskId", "==", id));
    const snapshotFeedback = await getDocs(feedbackQ);
    const allFeedbacks =  [] as FeedbackProps[];

    snapshotFeedback.forEach((item) => {
        allFeedbacks.push({
            like: item.data()?.like,
            dislike: item.data()?.dislike,
            taskId: item.data()?.taskId,
            user: item.data()?.user,
        })
    });
    
    
    return{
        props:{
            item: taskInfo,
            allComments: allComments,
            allFeedbacks: allFeedbacks,
        }
    }
}