import React, { useEffect, useState } from 'react';
import styles from '../Css/StatusModal.module.css';
import { useNavigate } from 'react-router-dom';

export default function StatusModal({
  statFadingOut,
  onClose,
  difWater,
  difFood,
  difHp,
  damage,
  day,
  prob,
  alive,
  causeOfDeath,
  imageUrl,
}) {
  const [isTextFadingOut, setIsTextFadingOut] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const navigate = useNavigate();
  useEffect(() => {
    if (statFadingOut) {
      setIsTextFadingOut(true);
      setTimeout(() => {
        onClose();
      }, 3000); // Fade-out 이후 모달 종료
      return;
    }

    let stepInterval;
    if (!statFadingOut) {
      stepInterval = setInterval(() => {
        setIsTextFadingOut(true);
        setTimeout(() => {
          setIsTextFadingOut(false);
          setCurrentStep((prev) => prev + 1);
        }, 500); // fade-out 시간
      }, 2000); // 각 단계마다 2초 대기

      if (currentStep > 2) {
        clearInterval(stepInterval); // 모든 단계가 끝나면 인터벌 종료
        setTimeout(() => onClose(), 1000); // 모달 자동 종료
      }
    }

    return () => clearInterval(stepInterval);
  }, [statFadingOut, currentStep]);

  const renderContent = () => {
    if (damage && currentStep === 0) {
      return (
        <h1 className={styles.text}>
          당신은 부상을 입었습니다. <br></br> 오늘 밤 당신이 사망할 확률은{' '}
          {damage * 10 + prob}% 입니다.
        </h1>
      );
    } else if (currentStep === 1) {
      if (alive == false) {
        navigate('/endstory', {
          state: { causeOfDeath: causeOfDeath, imageUrl: imageUrl },
        });
      } else {
        return <h1 className={styles.text}>Day - {day}</h1>;
      }
    } else if (currentStep === 2) {
      return (
        <div>
          <h1 className={styles.text}>
            <img className={styles.img} src="water.png"></img>{' '}
            {difWater >= 0 ? '+' : ''} {difWater}
          </h1>
          <h1 className={styles.text}>
            <img className={styles.img} src="food.png"></img>
            {difFood >= 0 ? '+' : ''} {difFood}
          </h1>
          <h1 className={styles.text}>
            <img className={styles.img} src="UI/heart.png"></img>
            {difHp >= 0 ? '+' : ''} {difHp}
          </h1>
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <div
      className={`${styles.overlay} ${
        statFadingOut ? styles.overlay_fade_out : ''
      }`}
    >
      <div
        className={`${styles.text_container} ${
          isTextFadingOut ? styles.fade_out : styles.fade_in
        }`}
      >
        {renderContent()}
      </div>
    </div>
  );
}