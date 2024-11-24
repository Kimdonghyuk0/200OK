import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import LoadingOverlay from '../Components/LoadingOverlay';
import BackgroundMusicController from '../Components/BackgroundMusicController';
import styles from '../Css/Game.module.css';
import mainstyle from '../App.module.css';
import {
	createUser,
	getMonologue,
	getNextStory,
	getStory,
	getUser,
	initStory,
	editFood,
	editWater,
} from '../service/service';

import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { addFood, addWater, setImg } from '../store/gameSlice';

function Game() {
	const { state } = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	let { name } = useSelector((state) => state.status);
	let check = useSelector((state) => state.status);
	let globwater = useSelector((state) => state.status.water);
	let globfood = useSelector((state) => state.status.food);

	let [content, setContent] = useState();
	let [choice, setChoice] = useState(1);
	let [choices, setChoices] = useState([]);
	let [imageUrl, setImageUrl] = useState();
	let [water, setWater] = useState();
	let [food, setFood] = useState();
	let [hp, setHp] = useState();
	let [mute, setMute] = useState(false);

	const [modal, setModal] = useState(false);
	const [fadingOut, setFadingOut] = useState(false);
	const [text, setText] = useState(['Loading...']);

	const [isWaterActive, setIsWaterActive] = useState(true);
	const [isFoodActive, setIsFoodActive] = useState(true);

	useEffect(() => {
		setWater(state.water);
		setFood(state.food);
	}, [state]);

	async function fetchOrCreateUser() {
		let storedUserId = sessionStorage.getItem('userId');
		let userId = storedUserId;

		// 저장된 사용자 ID가 없다면 초기화하여 생성
		if (!userId) {
			userId = await initUser();
			sessionStorage.setItem('userId', userId);
			await initStory(userId);
			storedUserId = userId;
		}
		await getUser(storedUserId).then((response) => {
			setFood(response.data.food);
			setWater(response.data.water);
			setHp(response.data.hp);
		});

		await getStory(storedUserId).then((response) => {
			setContent(response.data.content);
			setChoices([
				response.data.choice1,
				response.data.choice2,
				response.data.choice3,
			]);
			let link = atob(response.data.image);
			link = JSON.parse(link);
			dispatch(setImg(link.image_url));
			console.log(check);
			setImageUrl(link.image_url);
		});
		await getUser(storedUserId).then((response) => {
			setWater(response.data.water);
			setFood(response.data.food);
		});
		const monologue = await getMonologue(sessionStorage.getItem('userId'));
		setText(monologue.data.monologue);
	}

	const modalOff = () => {
		setFadingOut(true); // FadingOut 상태 활성화
		setTimeout(() => {
			setFadingOut(false); // FadingOut 종료
			setModal(false);
		}, 1000); // 1초 후 모달 완전히 닫기
	};

	async function initUser() {
		let user = {
			name,
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

	useEffect(() => {
		setModal(true);
		fetchOrCreateUser().then(() => {
			setTimeout(() => {
				setModal(false);
			}, 1000);
		});
	}, []);

	// 버튼 클릭 시 효과음 재생 및 페이지 이동
	const handleButtonClick = async () => {
		let obj = {
			choice: choices[choice],
		};

		let userId = sessionStorage.getItem('userId');
		if (isWaterActive) {
			dispatch(addWater());
			await editWater(userId, -1);
		}
		if (isFoodActive) {
			dispatch(addFood());
			await editFood(userId, -1);
		}

		setModal(true); // 모달 열기
		await getUser(sessionStorage.getItem('userId')).then((response) => {
			if (response.data.alive == false) {
				navigate('/end');
			}
		});

		(async () => {
			try {
				await getNextStory(sessionStorage.getItem('userId'), obj);
				await fetchOrCreateUser();
			} catch (error) {
			} finally {
				setTimeout(() => {
					modalOff();
				}, 1000);
			}
		})();
	};

	return (
		<>
			{modal && <LoadingOverlay fadingOut={fadingOut} text={text} />}
			<div className={mainstyle.div}>
				<div className={styles.imgdiv}>
					{' '}
					<img alt="img" className={styles.img} src={imageUrl}></img>
					<div
						className={styles.muteIconContainer}
						onClick={() => setMute(!mute)}
					>
						{mute ? (
							<HiOutlineSpeakerXMark className={styles.muteicon} />
						) : (
							<HiOutlineSpeakerWave className={styles.muteicon} />
						)}
					</div>
				</div>
				<div className={styles.textdiv}>{content}</div>
				{/* 선택지 영역 */}
				<div className={styles.choiceContainer}>
					<div
						className={styles.choice}
						onClick={() => {
							setChoice(0);
							//playsound('scared'); // 예시: 'scared' 효과음 재생
						}}
					>
						<input type="radio" id="choice1" name="choices" defaultChecked />
						<label htmlFor="choice1">{choices[0]}</label>
					</div>
					<div
						className={styles.choice}
						onClick={() => {
							setChoice(1);
							//playsound('peaceful'); // 예시: 'peaceful' 효과음 재생
						}}
					>
						<input type="radio" id="choice2" name="choices" />
						<label htmlFor="choice2">{choices[1]}</label>
					</div>
					<div
						className={styles.choice}
						onClick={() => {
							setChoice(2);
							//playsound('tense'); // 예시: 'tense' 효과음 재생
						}}
					>
						<input type="radio" id="choice3" name="choices" />
						<label htmlFor="choice3">{choices[2]}</label>
					</div>
				</div>
				<BackgroundMusicController
					mute={mute}
					modal={modal}
				></BackgroundMusicController>
				<div className={styles.userdiv}>
					<div className={styles.statusDiv}>
						{/* Water Status */}
						<div className={styles.statusItem}>
							<img
								src="/water.png"
								alt="Water"
								className={styles.statusImage}
							/>
							<div style={{ color: 'white', marginLeft: '8px' }}>{water}</div>

							<div className={styles.barContainer}>
								<div
									className={styles.bar}
									style={{
										width: `${(water / 10) * 100}%`, // water 상태에 따라 너비 조정
										backgroundColor: '#4d9ffb',
									}}
								></div>
							</div>

							{/* Toggle Button */}
							<div
								className={`${styles.toggleSwitch} ${
									isWaterActive ? styles.activew : ''
								}`}
								onClick={() => setIsWaterActive(!isWaterActive)} // 이벤트 리스너는 나중에 추가
							>
								<div className={styles.toggleKnob}></div>
							</div>
						</div>

						{/* Food Status */}
						<div className={styles.statusItem}>
							<img src="/food.png" alt="Food" className={styles.statusImage} />
							<div style={{ color: 'white', marginLeft: '3px' }}>{food}</div>

							<div className={styles.barContainer}>
								<div
									className={styles.bar}
									style={{
										width: `${(food / 10) * 100}%`, // food 상태에 따라 너비 조정
										backgroundColor: '#ffcc00',
									}}
								></div>
							</div>

							{/* Toggle Button */}
							<div
								className={`${styles.toggleSwitch} ${
									isFoodActive ? styles.activef : ''
								}`}
								onClick={() => setIsFoodActive(!isFoodActive)} // 이벤트 리스너는 나중에 추가
							>
								<div className={styles.toggleKnob}></div>
							</div>
						</div>
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
		</>
	);
}

export default Game;
