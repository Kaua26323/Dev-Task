import Head from "next/head";
import Image from "next/image";
import styles from "../../styles/home.module.css";
import heroImg from "../../public/assets/hero.png";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebaseConection";
import { GetStaticProps } from "next";


interface HomeProps{
  posts: number;
  comments: number;
}

export default function Home({posts, comments}: HomeProps) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Task App</title>
      </Head>

      <main className={styles.mainArea}>
        <Image src={heroImg} alt="image logo" className={styles.heroImg}
        priority/> 

        <h1 className={styles.title}>System designed to help you organize <br/> your studies and tasks!</h1>

        <div className={styles.infoBox}>
          <h1 className={styles.posts}>+{posts} posts</h1>
          <h1 className={styles.comments}>+{comments} comments</h1>
        </div>
      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {

    const postRef = collection(db, "tasks");
    const commentsRef = collection(db, "comments");

    const postSnapshot = await getDocs(postRef);
    const commentSnapshot = await getDocs(commentsRef);
   
  return{
    props:{
      posts: postSnapshot.size || 0,
      comments: commentSnapshot.size || 0,
    },
    revalidate: 120,
  }
}