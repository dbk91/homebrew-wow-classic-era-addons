cask "restedxp" do
  version "4.7.3"
  sha256 "0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5"

  url "https://github.com/RestedXP/RXPGuides/releases/download/v#{version}/RXPGuides-v#{version}-classic.zip"
  name "RestedXP"
  desc "RestedXP: WoW Classic leveling guides addon"
  homepage "https://github.com/RestedXP/RXPGuides"

  addon_dir = File.expand_path("/Applications/World of Warcraft/_classic_era_/Interface/AddOns")

  preflight do
    FileUtils.mkdir_p addon_dir unless Dir.exist?(addon_dir)
  end

  artifact "RXPGuides", target: "#{addon_dir}/RXPGuides"

  zap trash: [
    "#{addon_dir}/RXPGuides"
  ]
end
