import Link from "next/link";
import styles from "./header.module.css";
import { signIn, useSession, signOut } from "next-auth/react";

export function Header(){
    const {data: session, status} = useSession();
    
    return(
        <header className={styles.headerBox}>
            <section className={styles.sectionArea}>
                <nav className={styles.navArea}>
                    <Link href='/' >
                        <h1 className={styles.title}>
                            Task<span>Plus</span>
                        </h1>
                    </Link>

                    {session && (
                        <Link href='/dashboard'>
                            <h1 className={styles.painelArea}>
                                My Painel
                            </h1>
                        </Link>
                    )}
                </nav>
                
                {status === 'loading' ? (
                    <>
                    </> 

                ) : session ? (
                    <button className={styles.loginButton} onClick={() => signOut()}>
                        Olá {session.user?.name}
                    </button>

                ) : (
                    <button className={styles.loginButton} onClick={() => signIn("google")}> 
                        Acessar
                    </button>
                )}
            </section>
        </header>
    )
}
