// @flow
import React from 'react';
import { NavLink } from 'core';
import './index.css';

type Props = { links: Array<MainNavigationLink>, className: string };

const Navigation = ({ links, className }: Props) =>
  <nav className={className} styleName="navigation">
    <ul styleName="links">
      {links.map(
        link =>
          !link.hide
            ? <li key={link.to} styleName="link-wrap">
                <NavLink strict={true} styleName="link" to={link.to}>
                  {link.text}
                </NavLink>
              </li>
            : null
      )}
    </ul>
  </nav>;

export default Navigation;
