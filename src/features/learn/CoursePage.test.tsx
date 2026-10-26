import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { useProgress } from '@/store/progress';
import CoursePage from './CoursePage';
import { getLessonMeta } from './lessonMeta';

function renderCourse(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/learn/course/:courseId" element={<CoursePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CoursePage', () => {
  beforeEach(() => useProgress.getState().resetAll());

  it('uses the shared not-found page for an unknown course', () => {
    renderCourse('/learn/course/no-such-course');
    expect(screen.getByRole('heading', { level: 1, name: 'Course not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Learn' })).toHaveAttribute('href', '/learn');
    expect(document.title).toMatch(/^Course not found · /);
  });

  it('names each item with what its row shows and links lessons with the course', () => {
    const meta = getLessonMeta('the-board');
    expect(meta).toBeDefined();
    renderCourse('/learn/course/first-steps');
    const link = screen.getByRole('link', {
      name: `${meta?.title}, Lesson, ${meta?.minutes} min · ${meta?.category}`,
    });
    expect(link).toHaveAttribute('href', '/learn/the-board?course=first-steps');
    expect(
      screen.getByRole('link', {
        name: 'Solve 5 Hanging piece puzzles, Checkpoint, 0 of 5 solved',
      }),
    ).toBeInTheDocument();
  });

  it('says in the name when an item is done', () => {
    const meta = getLessonMeta('the-board');
    useProgress.setState({
      lessons: { 'the-board': { stepsDone: [], completedAt: 1, lastVisitedAt: 1 } },
    });
    renderCourse('/learn/course/first-steps');
    expect(
      screen.getByRole('link', {
        name: `${meta?.title}, Lesson, ${meta?.minutes} min · ${meta?.category}, done`,
      }),
    ).toBeInTheDocument();
  });
});

describe('CoursePage: marking lessons done', () => {
  beforeEach(() => useProgress.getState().resetAll());

  it('has a done check for every lesson, and only for lessons', () => {
    renderCourse('/learn/course/first-steps');
    const checks = screen.getAllByRole('checkbox', { name: /^Mark as done: / });
    const lessons = screen.getAllByRole('link', { name: /, Lesson, / });
    expect(checks).toHaveLength(lessons.length);
    expect(screen.queryByRole('checkbox', { name: /Coordinates/ })).toBeNull();
  });

  it('marks a lesson done from its row, which then counts in the course', () => {
    renderCourse('/learn/course/first-steps');
    const check = screen.getByRole('checkbox', {
      name: 'Mark as done: The board and the notation',
    });
    expect(check).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(check);
    expect(check).toHaveAttribute('aria-checked', 'true');
    expect(useProgress.getState().lessons['the-board']).toMatchObject({ marked: true });
    expect(screen.getByText(/^1 of \d+ steps done$/)).toBeInTheDocument();
    fireEvent.click(check);
    expect(check).toHaveAttribute('aria-checked', 'false');
    expect(useProgress.getState().lessons['the-board']?.completedAt).toBeNull();
  });

  it('keeps the "up next" note of a later unit under its text', () => {
    renderCourse('/learn/course/first-steps');
    const note = screen.getAllByText(/^Up next after unit \d$/)[0];
    expect(note?.closest('.course__unit-text')).not.toBeNull();
  });
});
