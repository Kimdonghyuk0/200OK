// Game.js

import React, { useEffect, useRef, useState } from 'react';
import { useLoaderData, useLocation, useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import styles from '../Css/Game.module.css';
import mainstyle from '../App.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { setUserId } from '../store/gameSlice';
import {
  createUser,
  getNextStory,
  getStory,
  initStory,
} from '../service/service';
import LoadingOverlay from '../Components/LoadingOverlay';

function Game(props) {
  const navigate = useNavigate();
  const clickSoundRef = useRef(null); // 클릭 효과음 재생을 위한 useRef
  const situationSoundRef = useRef(null); // 상황에 맞는 효과음 재생을 위한 useRef

  let { name, hp } = useSelector((state) => state.status);
  const dispatch = useDispatch();

  const { state } = useLocation();

  let [content, setContent] = useState();
  let [choice, setChoice] = useState(1);
  let [choices, setChoices] = useState([]);
  let [imageUrl, setImageUrl] = useState();
  let [modal, setModal] = useState(false);

  async function initUser() {
    let user = {
      name: name,
      water: state.water,
      food: state.food,
      alive: true,
      hp: 10,
      probability: 1,
      day: 1,
    };
    const response = await createUser(user);
    return response.data.id;
  }

  // 사용자 ID가 있는지 확인하고, 없는 경우 초기화
  async function fetchOrCreateUser() {
    setModal(true);
    const storedUserId = sessionStorage.getItem('userId');
    console.log(`로컬 저장된 사용자 ID: ${storedUserId}`);

    try {
      let userId = storedUserId;

      // 저장된 사용자 ID가 없다면 초기화하여 생성
      if (!userId) {
        userId = await initUser();
        sessionStorage.setItem('userId', userId);
        dispatch(setUserId(userId));
      }

      // 사용자 ID로 스토리 가져오기 시도
      await getStory(userId);
    } catch (e) {
      console.log(e);
      if (e.response && e.response.status === 404) {
        // 스토리가 없을 경우 초기화하여 생성
        const newUserId = await initUser();
        sessionStorage.setItem('userId', newUserId);
        dispatch(setUserId(newUserId));
      } else {
        console.error('스토리를 가져오는 중 오류 발생:', e);
      }
    } finally {
      await getStory(storedUserId).then((response) => {
        setContent(response.data.content);
        setChoices([
          response.data.choice1,
          response.data.choice2,
          response.data.choice3,
        ]);
        let link = atob(response.data.image);
        link = JSON.parse(link);
        setImageUrl(link.image_url);
      });
    }

    setModal(false);
  }

  useEffect(() => {
    fetchOrCreateUser();
  }, []);

  // 상황에 맞는 사운드를 재생하는 함수
  const playsound = (situation) => {
    let soundKey = '';
    switch (situation) {
      case 'scared':
        soundKey = 'scared';
        break;
      case 'peaceful':
        soundKey = 'peaceful';
        break;
      case 'tense':
        soundKey = 'tense';
        break;
      case 'adventure':
        soundKey = 'adventure';
        break;
      default:
        console.log('Unknown situation:', situation);
        return;
    }

    // 상황에 맞는 효과음 재생
    if (soundKey && this.sound) {
      this.sound.add(soundKey).play();
    }
  };

  // 버튼 클릭 시 효과음 재생 및 페이지 이동
  const handleButtonClick = async () => {
    let obj = {
      choice: choice,
    };

    setModal(true);
    await getNextStory(sessionStorage.getItem('userId'), obj);
    fetchOrCreateUser();
    setModal(false);
  };

  return (
    <>
      {modal && <LoadingOverlay text="Loading..." show={modal} />}
      <div className={mainstyle.div}>
        <div className={styles.imgdiv}>
          {' '}
          <img alt="img" className={styles.img} src={imageUrl}></img>
        </div>
        <div className={styles.textdiv}>{content}</div>

        {/* 선택지 영역 */}
        <div className={styles.choiceContainer}>
          <div
            className={styles.choice}
            onClick={() => {
              setChoice(1);
              //playsound('scared'); // 예시: 'scared' 효과음 재생
            }}
          >
            <input type="radio" id="choice1" name="choices" defaultChecked />
            <label htmlFor="choice1">{choices[0]}</label>
          </div>
          <div
            className={styles.choice}
            onClick={() => {
              setChoice(2);
              //playsound('peaceful'); // 예시: 'peaceful' 효과음 재생
            }}
          >
            <input type="radio" id="choice2" name="choices" />
            <label htmlFor="choice2">{choices[1]}</label>
          </div>
          <div
            className={styles.choice}
            onClick={() => {
              setChoice(3);
              //playsound('tense'); // 예시: 'tense' 효과음 재생
            }}
          >
            <input type="radio" id="choice3" name="choices" />
            <label htmlFor="choice3">{choices[2]}</label>
          </div>
        </div>

        <div className={styles.userdiv}>
          <div className={styles.statusdiv}>
            <img
              src="/water.png"
              alt="Water"
              className={styles.statusImage}
              style={{ border: '1px solid green' }}
            />
            물: 5
            <img src="/food.png" alt="Food" className={styles.statusImage} />
            <p>식량: 3</p>
          </div>
          <div className={styles.choicediv}>
            <button
              className={`${styles.submitButton}`}
              onClick={() => {
                handleButtonClick();
              }}
            >
              선택
            </button>
          </div>
        </div>
      </div>

      {/* 클릭 효과음 오디오 요소 */}
      <audio ref={clickSoundRef} src="Sounds/click-button.mp3" />
    </>
  );
}

export default Game;
