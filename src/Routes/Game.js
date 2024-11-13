// Game.js

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function Game() {
  const navigate = useNavigate();
  const clickSoundRef = useRef(null); // 클릭 효과음 재생을 위한 useRef
  const situationSoundRef = useRef(null); // 상황에 맞는 효과음 재생을 위한 useRef

  let { userId, name, water, food, hp } = useSelector((state) => state.status);
  const dispatch = useDispatch();

  let [content, setContent] = useState();
  let [choice, setChoice] = useState(1);
  let [choices, setChoices] = useState([]);
  let [imageUrl, setImageUrl] = useState();

  async function initUser() {
    let user = {
      name: name,
      water: water,
      food: food,
      alive: true,
      hp: 10,
      probability: 1,
      day: 1,
    };
    const response = await createUser(user);
    return response.data.id;
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    console.log(`로컬 저장된 사용자 ID: ${storedUserId}`);

    // 사용자 ID가 있는지 확인하고, 없는 경우 초기화
    async function fetchOrCreateUser() {
      try {
        let userId = storedUserId;

        // 저장된 사용자 ID가 없다면 초기화하여 생성
        if (!userId) {
          userId = await initUser();
          localStorage.setItem('userId', userId);
          dispatch(setUserId(userId));
        }

        // 사용자 ID로 스토리 가져오기 시도
        await getStory(userId);
      } catch (e) {
        console.log(e);
        if (e.response && e.response.status === 404) {
          // 스토리가 없을 경우 초기화하여 생성
          const newUserId = await initUser();
          localStorage.setItem('userId', newUserId);
          dispatch(setUserId(newUserId));
          await initStory(newUserId);
        } else {
          console.error('스토리를 가져오는 중 오류 발생:', e);
        }
      } finally {
        await getStory(storedUserId).then((response) => {
          setContent(response.data.content);
          setChoices([response.data.choice1, response.data.choice2, response.data.choice3]);
          let link = atob(response.data.image);
          link = JSON.parse(link);
          setImageUrl(link.image_url);
        });
      }
    }

    fetchOrCreateUser();
  }, []);

  useEffect(() => {
    // Phaser 게임 인스턴스를 설정하고 배경 음악을 재생하는 설정
    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000, // 배경을 검정색으로 설정
      scene: {
        preload: preload,
        create: create,
      },
    };

    // Phaser 게임 인스턴스를 생성
    const game = new Phaser.Game(config);

    // Phaser preload 함수 - 배경 음악 로드
    function preload() {
      this.load.audio('backgroundMusic', 'Sounds/gameost.mp3'); // 여기에 실제 음악 경로 넣기
      this.load.audio('scared', 'Sounds/scared-sound.mp3');
      this.load.audio('peaceful', 'Sounds/peaceful-sound.mp3');
      this.load.audio('tense', 'Sounds/tense-sound.mp3');
      this.load.audio('adventure', 'Sounds/adventure-sound.mp3');
    }

    // Phaser create 함수 - 배경 음악 재생
    function create() {
		//playsound("scared");
      this.sound.play('backgroundMusic', {
        loop: true, // 반복 재생
        volume: 0.5, // 볼륨 조절
      });
    }

    // 컴포넌트 언마운트 시 음악 멈추기
    return () => {
      if (game.sound && game.sound.stopAll) {
        try {
          game.sound.stopAll(); // 모든 음악을 멈추고, Phaser 인스턴스를 종료
        } catch (error) {
          console.error('Error stopping sounds:', error);
        }
      } else {
        console.warn('Phaser sound manager is not initialized correctly.');
      }
      game.destroy(true);
    };
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
  const handleButtonClick = () => {
    let obj = {
      choice: choice,
    };

    getNextStory(localStorage.getItem('userId'), obj);

    // 버튼 클릭 시 사운드 재생
    if (clickSoundRef.current) {
      clickSoundRef.current.play();
    }

    // 1초 후에 "wait.js"로 이동
    setTimeout(() => {
      navigate('/wait');
    }, 100); // 1000ms = 1초 후에 페이지 이동
  };

  return (
    <>
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
              playsound('scared'); // 예시: 'scared' 효과음 재생
            }}
          >
            <input type="radio" id="choice1" name="choices" defaultChecked />
            <label htmlFor="choice1">{choices[0]}</label>
          </div>
          <div
            className={styles.choice}
            onClick={() => {
              setChoice(2);
              playsound('peaceful'); // 예시: 'peaceful' 효과음 재생
            }}
          >
            <input type="radio" id="choice2" name="choices" />
            <label htmlFor="choice2">{choices[1]}</label>
          </div>
          <div
            className={styles.choice}
            onClick={() => {
              setChoice(3);
              playsound('tense'); // 예시: 'tense' 효과음 재생
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
