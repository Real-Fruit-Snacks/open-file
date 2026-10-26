import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { Badge, Card, LinkButton, NotFound, ProgressBar, Icon } from '@/components/ui';
import { siteConfig } from '@/site.config';
import { useProgress } from '@/store/progress';
import { useRepertoire } from '@/store/repertoire';
import { courseStatus } from './courseProgress';
import { LessonCheck } from './LessonDone';
import { getCourse } from './courses';
import { LEVEL_LABELS } from './model';
import './learn.css';

export default function CoursePage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const course = getCourse(courseId);
  const progress = useProgress();
  const cards = useRepertoire((s) => s.cards);
  const status = useMemo(
    () => (course ? courseStatus(course, progress, cards) : null),
    [course, progress, cards],
  );

  useEffect(() => {
    document.title = `${course?.title ?? 'Course not found'} · ${siteConfig.name}`;
  }, [course]);

  if (!course || !status) {
    return (
      <NotFound title="Course not found" backTo="/learn" backLabel="Back to Learn">
        <p>There is no course at this address. The courses are listed on the Learn page.</p>
      </NotFound>
    );
  }

  return (
    <div className="course">
      <div className="page-header">
        <p className="card__eyebrow">
          <Link to="/learn">Learn</Link> / {LEVEL_LABELS[course.level].title} course
        </p>
        <h1>{course.title}</h1>
        <p>{course.blurb}</p>
      </div>

      <Card className="course__summary">
        <div className="row row--between">
          <div>
            <strong>
              {status.doneItems} of {status.totalItems} steps done
            </strong>
            <div className="small muted">
              {status.next
                ? `Up next: ${status.next.title} (${status.next.unit.title})`
                : 'You have completed this course.'}
            </div>
          </div>
          {status.next ? (
            <LinkButton variant="primary" to={status.next.to} data-testid="course-continue">
              {status.doneItems ? 'Continue' : 'Start'}
            </LinkButton>
          ) : null}
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar value={status.doneItems} max={status.totalItems} label="Course progress" />
        </div>
      </Card>

      <ol className="course__units" role="list">
        {status.units.map((unit, index) => (
          <li
            key={unit.unit.id}
            className={`course__unit${unit.done ? ' is-done' : ''}${unit.unlocked ? '' : ' is-locked'}`}
            data-testid={`unit-${unit.unit.id}`}
          >
            <div className="course__unit-header">
              <span className="course__unit-number" aria-hidden="true">
                {unit.done ? <Icon name="check" size={16} /> : index + 1}
              </span>
              <div className="course__unit-text">
                <h2>{unit.unit.title}</h2>
                <p className="small muted">{unit.unit.blurb}</p>
                {!unit.unlocked ? (
                  <Badge tone="neutral" className="course__lock">
                    Up next after unit {index}
                  </Badge>
                ) : null}
              </div>
            </div>
            <ul className="course__items" role="list">
              {unit.items.map((item) => (
                <li
                  key={`${item.item.type}:${item.to}`}
                  className={`course__row${item.done ? ' is-done' : ''}`}
                >
                  {item.item.type === 'lesson' ? (
                    // A lesson can be marked done (or not done) from here.
                    <LessonCheck lessonId={item.item.id} title={item.title} done={item.done} />
                  ) : (
                    <span
                      className={`course__status${item.done ? ' is-done' : ''}`}
                      aria-hidden="true"
                    >
                      <Icon name="check" size={14} />
                    </span>
                  )}
                  <Link
                    to={item.to}
                    className="course__item"
                    // The name is what the row shows, in its order (WCAG 2.5.3, Label in Name):
                    // the title, the kind and the detail ("3 of 5 solved", "5 min · Rules"), then
                    // whether it is done, which the row shows with its tick.
                    aria-label={`${item.title}, ${item.kind}, ${item.detail}${item.done ? ', done' : ''}`}
                  >
                    <span className="course__item-title">{item.title}</span>{' '}
                    <span className="small muted">
                      {item.kind} · {item.detail}
                    </span>
                    {item.progress && !item.done ? (
                      <ProgressBar
                        value={item.progress.value}
                        max={item.progress.target}
                        label={`${item.title} progress`}
                      />
                    ) : null}
                  </Link>
                  <Icon
                    name="chevron-right"
                    size={18}
                    className="course__chevron"
                    aria-hidden="true"
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
