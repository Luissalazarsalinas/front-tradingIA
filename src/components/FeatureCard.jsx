import React from "react";

export const FeatureCard = ({title, text, icon}) => {
    return (
        <div className="col-md-4 mb-4">
            <div className="feature-card card custom-card text-center fade-in">
                <div className="icon">{icon}</div>
                <h5 className="mt-3">{title}</h5>
                <p className="text-muted">{text}</p>
            </div>
        </div>
        );
}